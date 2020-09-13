/* eslint-disable no-async-promise-executor */
/* eslint-disable no-case-declarations */
/* eslint-disable no-await-in-loop */
import {
    Activity,
    ActivityTypes,
    ResourceResponse,
    ConversationReference,
    ConversationsApi,
} from 'iopa-botadapter-schema'

import {
    HttpAuthAppCredentials,
    SimpleCredentialProvider,
    JwtTokenValidation,
} from 'iopa-botadapter-schema-auth'

import {
    IopaBotAdapterContext,
    Adapter,
    AdapterCore as IAdapterCore,
    BotAdapterApp,
} from 'iopa-botadapter-types'

import { IopaContext, RouterApp } from 'iopa-types'

import retry from 'async-retry'
import { toIopaBotAdapterContext } from './context'

// This key is exported internally so that the TeamsActivityHandler will not overwrite any already set InvokeResponses.
export const INVOKE_RESPONSE_KEY = 'urn:io.iopa.invokeResponse'
export const URN_BOTADAPTER = 'urn:io.iopa:botadapater'
export const URN_BOTINTENT_LITERAL = 'urn:io.iopa.bot:intent:literal'

/** The Iopa BotFrameworkAdapter */
export class AdapterCore implements IAdapterCore {
    protected readonly _app: RouterApp<{}, IopaBotAdapterContext>

    public readonly credentials: HttpAuthAppCredentials

    protected readonly credentialsProvider: SimpleCredentialProvider

    constructor(app: RouterApp<{}, IopaBotAdapterContext>) {
        this._app = app
        ;(app as BotAdapterApp).botadapter = (this as unknown) as Adapter

        // Relocate the tenantId field used by MS Teams to a new location (from channelData to conversation)
        // This will only occur on activities from teams that include tenant info in channelData but NOT in conversation,
        // thus should be future friendly.  However, once the the transition is complete. we can remove this.
        app.use(
            async (
                context: IopaBotAdapterContext,
                next: () => Promise<void>
            ) => {
                if (!context['bot.Capability']) {
                    return next()
                }

                const { activity } = context['bot.Capability']

                if (
                    activity.channelId === 'msteams' &&
                    activity &&
                    activity.conversation &&
                    !activity.conversation.tenantId &&
                    activity.channelData &&
                    activity.channelData.tenant
                ) {
                    activity.conversation.tenantId =
                        activity.channelData.tenant.id
                }

                return next()
            },
            'iopa-botadapter.AdapterCore'
        )

        const appId = process.env.MSAPP_ID
        const appPassword = process.env.MSAPP_SECRET

        this.credentials = new HttpAuthAppCredentials(
            appId,
            appPassword || '',
            undefined
        )

        this.credentialsProvider = new SimpleCredentialProvider(
            this.credentials.appId,
            this.credentials.appPassword
        )
    }

    /** An asynchronous method that creates a turn context and runs the middleware pipeline
     * for an incoming activity from HTTP wire */
    public async invokeActivity(
        context: IopaContext,
        next: () => Promise<void>
    ): Promise<void> {
        if (context['iopa.Protocol'] === URN_BOTADAPTER) {
            // skip validation and parsing for synthetic contexts created by this framework
            await next()
            return
        }

        let body: any
        let status: number
        let processError: Error
        try {
            // Parse body of request
            status = 400
            const activity: Activity = await _parseRequest(context)

            if (!activity) {
                await next()
                return
            }

            // Authenticate the incoming request
            status = 401
            const authHeader: string = context['iopa.Headers'].get(
                'authorization'
            )
            await this.authenticateRequest(activity, authHeader)

            // Expand Context with Iopa Turn Context from
            status = 500
            const contextExpanded: IopaBotAdapterContext = toIopaBotAdapterContext(
                context,
                (this as unknown) as Adapter,
                activity
            )

            contextExpanded['bot.Source'] = URN_BOTADAPTER

            console.log(
                `[BotAdapter] Authorization Complete ${context.get(
                    'server.TimeElapsed'
                )}ms`
            )

            if (
                contextExpanded['bot.Capability'].activity.type ===
                ActivityTypes.Message
            ) {
                // await contextExpanded.response.showTypingIndicator()
            }

            // Main processing of received activity
            try {
                await next()
            } catch (err) {
                if (this.onTurnError) {
                    await this.onTurnError(contextExpanded, err)
                } else {
                    throw err
                }
            }

            // Retrieve cached invoke response
            if (activity.type === ActivityTypes.Invoke) {
                const invokeResponse: any = contextExpanded[
                    'bot.Capability'
                ].turnState.get(INVOKE_RESPONSE_KEY)
                if (invokeResponse && invokeResponse.value) {
                    const { value } = invokeResponse
                    status = value.status
                    body = value.body
                } else {
                    status = 501
                }
            } else {
                status = 200
            }
        } catch (err) {
            // Catch the error to try and throw the stacktrace out of processActivity()
            processError = err
            body = err.statusText || err.message || err.toString()
        }

        // Return status
        context.response['iopa.StatusCode'] = status
        if (body) {
            context.response.end(body)
        } else {
            context.response.end()
        }

        // Check for an error
        if (status >= 400) {
            if (processError && (processError as Error).stack) {
                context.error(processError)
            } else {
                try {
                    throw new Error(`AdapterCore.invoke(): ${status} ERROR`)
                } catch (ex) {
                    context.error(processError)
                }
            }
        }
    }

    /** An asynchronous method that sends a set of outgoing activities to a channel server. */
    public async sendActivities(
        context: IopaBotAdapterContext,
        activities: Partial<Activity>[]
    ): Promise<ResourceResponse[]> {
        const responses: ResourceResponse[] = []
        for (let i = 0; i < activities.length; i++) {
            const activity: Partial<Activity> = activities[i]
            switch (activity.type as ActivityTypes | string) {
                case 'delay':
                    await delay(
                        typeof activity.value === 'number'
                            ? activity.value
                            : 1000
                    )
                    responses.push({} as ResourceResponse)
                    break
                case 'invokeResponse':
                    // Cache response to context object. This will be retrieved when turn completes.
                    context['bot.Capability'].turnState.set(
                        INVOKE_RESPONSE_KEY,
                        activity
                    )
                    responses.push({} as ResourceResponse)
                    break
                default:
                    if (!activity.serviceUrl) {
                        throw new Error(
                            `AdapterCore.sendActivities(): missing serviceUrl.`
                        )
                    }
                    if (!activity.conversation || !activity.conversation.id) {
                        throw new Error(
                            `AdapterCore.sendActivities(): missing conversation id.`
                        )
                    }
                    const client = this.createConversationsApiClient(
                        activity.serviceUrl
                    )
                    if (
                        activity.type === ActivityTypes.Trace &&
                        activity.channelId !== 'emulator'
                    ) {
                        // Just eat activity
                        responses.push({} as ResourceResponse)
                    } else if (activity.replyToId) {
                        responses.push(
                            (await client.conversationsReplyToActivity(
                                activity.conversation.id,
                                activity.replyToId,
                                activity as any
                            )) as any
                        )
                    } else {
                        responses.push(
                            (await client.conversationsSendToConversation(
                                activity.conversation.id,
                                activity as any
                            )) as any
                        )
                    }
                    break
            }
        }
        return responses
    }

    /** An asynchronous method that replaces a previous activity with an updated version. */
    public async updateActivity(activity: Partial<Activity>): Promise<void> {
        if (!activity.serviceUrl) {
            throw new Error(`AdapterCore.updateActivity(): missing serviceUrl`)
        }
        if (!activity.conversation || !activity.conversation.id) {
            throw new Error(
                `AdapterCore.updateActivity(): missing conversation or conversation.id`
            )
        }
        if (!activity.id) {
            throw new Error(`AdapterCore.updateActivity(): missing activity.id`)
        }
        const client = this.createConversationsApiClient(activity.serviceUrl)
        await client.conversationsUpdateActivity(
            activity.conversation.id,
            activity.id,
            activity as any
        )
    }

    /** An asynchronous method that deletes an existing activity.  */
    public async deleteActivity(
        reference: Partial<ConversationReference>
    ): Promise<void> {
        if (!reference.serviceUrl) {
            throw new Error(`AdapterCore.deleteActivity(): missing serviceUrl`)
        }
        if (!reference.conversation || !reference.conversation.id) {
            throw new Error(
                `AdapterCore.deleteActivity(): missing conversation or conversation.id`
            )
        }
        if (!reference.activityId) {
            throw new Error(`AdapterCore.deleteActivity(): missing activityId`)
        }
        const client = this.createConversationsApiClient(reference.serviceUrl)
        await client.conversationsDeleteActivity(
            reference.conversation.id,
            reference.activityId
        )
    }

    /** Creates a connector client.  Used by Teams Extensions in this package, not external */
    public createConversationsApiClient(serviceUrl: string): ConversationsApi {
        const fetchProxy = async (url: string, init: any) => {
            if (init && init.body && init.body instanceof URLSearchParams) {
                init.headers.set(
                    'Content-Type',
                    'application/x-www-form-urlencoded; charset=UTF-8'
                )
            }

            try {
                await this.credentials.signRequest(url, init)

                const result = await retry(
                    async (bail) => {
                        const result = await fetch(url, init)

                        if (result.status === 403) {
                            bail(new Error('Unauthorized'))
                        }

                        // override json in case of empty successful (202) responses
                        if (result.status === 202) {
                            result.json = async () => ({})
                        }

                        return result
                    },
                    {
                        retries: 3,
                        minTimeout: 2000,
                    }
                )

                return result
            } catch (ex) {
                // rethrow for stack trace upon timeout
                try {
                    throw ex
                } catch (ex) {
                    console.log(`Fetch Error getting ${url}`)
                    console.error(ex)
                    return {
                        status: 500,
                    }
                }
            }
        }

        const client = new ConversationsApi(
            {},
            serviceUrl.replace(/\/+$/, ''),
            fetchProxy
        )

        return client
    }

    /** Allows for the overriding of authentication in unit tests. */
    private async authenticateRequest(
        activity: Partial<Activity>,
        authHeader: string
    ): Promise<void> {
        const claims = await JwtTokenValidation.authenticateRequest(
            activity as Activity,
            authHeader,
            this.credentialsProvider
        )
        if (!claims.isAuthenticated) {
            throw new Error('Unauthorized Access. Request is not authorized')
        }
    }

    /**  Creates a turn context */
    public createContext(activity: Partial<Activity>): IopaBotAdapterContext {
        const plaincontext = this._app.createContext(activity.serviceUrl, {
            withResponse: true,
            protocol: URN_BOTADAPTER,
        })

        const context = toIopaBotAdapterContext(
            plaincontext,
            (this as unknown) as Adapter,
            activity
        )

        return context
    }

    private turnError: (
        context: IopaBotAdapterContext,
        error: Error
    ) => Promise<void>

    /** Gets/sets a error handler that will be called anytime an uncaught exception is raised during a turn */
    public get onTurnError(): (
        context: IopaBotAdapterContext,
        error: Error
    ) => Promise<void> {
        return this.turnError
    }

    public set onTurnError(
        value: (context: IopaBotAdapterContext, error: Error) => Promise<void>
    ) {
        this.turnError = value
    }
}

/** Handles incoming webhooks from the botframework */
function _parseRequest(context: IopaContext): Promise<Activity> {
    return new Promise(
        async (resolve: any, reject: any): Promise<void> => {
            const activity = await context['iopa.Body']
            try {
                if (typeof activity !== 'object') {
                    throw new Error(
                        `AdapterCore._parseRequest(): invalid request body.`
                    )
                }
                if (typeof activity.type !== 'string') {
                    throw new Error(
                        `AdapterCore._parseRequest(): missing activity type.`
                    )
                }
                if (typeof activity.timestamp === 'string') {
                    activity.timestamp = new Date(activity.timestamp)
                }
                if (typeof activity.localTimestamp === 'string') {
                    activity.localTimestamp = new Date(activity.localTimestamp)
                }
                if (typeof activity.expiration === 'string') {
                    activity.expiration = new Date(activity.expiration)
                }
                resolve(activity)
            } catch (err) {
                console.error(err)
                resolve(null)
            }
        }
    )
}

function delay(/** timeout in ms */ timeout: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout)
    })
}

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error('timeout'))
        }, ms)
        promise.then(resolve, reject)
    })
}
