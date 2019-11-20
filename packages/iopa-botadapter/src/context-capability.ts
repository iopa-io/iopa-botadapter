import {
    Activity,
    ConversationReference,
    ResourceResponse,
    ActivityTypes,
    InputHints,
    ChannelAccount,
} from 'iopa-botadapter-schema'

import {
    ContextMethods as IContextMethods,
    TeamsHelpers as ITeamsHelpers,
    TokenHelpers as ITokenHelpers,
    IBotAdapterCapability,
} from 'iopa-botadapter-types'

import { IopaContext } from 'iopa-types'
import { Adapter, IopaBotAdapterContext } from 'iopa-botadapter-types'
import { TeamsHelpers } from './context-helpers-teams'
import { TokenHelpers } from './context-helpers-token'

const s_context: unique symbol = Symbol('urn:io:iopa:bot:response:context')

export class BotAdapterCapability
    implements IBotAdapterCapability, IContextMethods {
    private readonly [s_context]: IopaBotAdapterContext
    public readonly adapter: Adapter
    public readonly activity: Activity
    public readonly teams: ITeamsHelpers
    public readonly tokens: ITokenHelpers
    public readonly turnState: Map<any, any>
    public responded: boolean

    constructor(
        plaincontext: IopaContext,
        adapter: Adapter,
        activity: Activity
    ) {
        this[s_context] = plaincontext as IopaBotAdapterContext
        this.activity = activity
        this.adapter = adapter
        this.teams = new TeamsHelpers(plaincontext as IopaBotAdapterContext)
        this.tokens = new TokenHelpers(plaincontext as IopaBotAdapterContext)
        this.turnState = new Map<any, any>()
        this.responded = false
    }

    /** Sends a single activity or message to the user */
    public sendActivity(
        activityOrText: string | Partial<Activity>,
        speak?: string,
        inputHint?: string | InputHints
    ): Promise<ResourceResponse | undefined> {
        let a: Partial<Activity>
        if (typeof activityOrText === 'string') {
            a = {
                text: activityOrText,
                inputHint:
                    (inputHint as InputHints) || InputHints.AcceptingInput,
            }
            if (speak) {
                a.speak = speak
            }
        } else {
            a = activityOrText
        }

        return this.sendActivities([a]).then((responses: ResourceResponse[]) =>
            responses && responses.length > 0 ? responses[0] : undefined
        )
    }

    /** Sends a set of activities to the user. An array of responses from the server will be returned  */
    public sendActivities(
        activities: Partial<Activity>[]
    ): Promise<ResourceResponse[]> {
        let sentNonTraceActivity = false
        const ref: Partial<ConversationReference> = this.adapter.getConversationReference(
            this.activity
        )
        const output: Partial<Activity>[] = activities.map(
            (a: Partial<Activity>) => {
                const o: Partial<Activity> = this.adapter.applyConversationReference(
                    { ...a },
                    ref
                )
                if (!o.type) {
                    o.type = ActivityTypes.Message
                }
                if (o.type !== ActivityTypes.Trace) {
                    sentNonTraceActivity = true
                }

                return o
            }
        )

        return this.adapter.emit(
            'ContextSendActivities',
            this[s_context],
            { activities: output },
            () => {
                return this.adapter
                    .sendActivities(this[s_context], output)
                    .then((responses: ResourceResponse[]) => {
                        // Set responded flag
                        if (sentNonTraceActivity) {
                            this.responded = true
                        }

                        return responses
                    })
            }
        )
    }

    /** Deletes an existing activity */
    public deleteActivity(
        idOrReference: string | Partial<ConversationReference>
    ): Promise<void> {
        let reference: Partial<ConversationReference>
        if (typeof idOrReference === 'string') {
            reference = this.adapter.getConversationReference(this.activity)
            reference.activityId = idOrReference
        } else {
            reference = idOrReference
        }

        return this.adapter.emit(
            'ContextDeleteActivity',
            this[s_context],
            { reference },
            () => this.adapter.deleteActivity(reference)
        )
    }

    /** Replaces an existing activity */
    public updateActivity(activity: Partial<Activity>): Promise<void> {
        const ref: Partial<ConversationReference> = this.adapter.getConversationReference(
            this.activity
        )
        const a: Partial<Activity> = this.adapter.applyConversationReference(
            activity,
            ref
        )

        return this.adapter.emit(
            'ContextUpdateActivity',
            this[s_context],
            { activity },
            () => this.adapter.updateActivity(a)
        )
    }

    /** An asynchronous method that lists the members of the current conversation.  */
    public async getConversationMembers(): Promise<ChannelAccount[]> {
        if (!this.activity.serviceUrl) {
            throw new Error(
                `ActivityHelpers.getConversationMembers(): missing serviceUrl`
            )
        }
        if (!this.activity.conversation || !this.activity.conversation.id) {
            throw new Error(
                `ActivityHelpers.getConversationMembers(): missing conversation or conversation.id`
            )
        }
        const serviceUrl: string = this.activity.serviceUrl
        const conversationId: string = this.activity.conversation.id
        const client = this.adapter.createConversationsApiClient(serviceUrl)

        return await client.conversationsGetConversationMembers(conversationId)
    }

    getConversationReference(): Partial<ConversationReference> {
        return this.adapter.getConversationReference(this.activity)
    }

    public copyTo(this: IopaBotAdapterContext, context: IopaBotAdapterContext) {
        // TODO COPY REFERENCES ETC.

        return context
    }
}
