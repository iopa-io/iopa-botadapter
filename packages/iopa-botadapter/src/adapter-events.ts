import {
    AdapterEvents as IAdapterEvents,
    IopaBotAdapterContext,
    InvokeResponse,
} from 'iopa-botadapter-types'

import {
    ActivityTypes,
    ChannelAccount,
    MessageReaction,
    Activity,
    ConversationReference,
    ResourceResponse,
} from 'iopa-botadapter-schema'

export type IopaEventHandlerNoArgs = (
    context: IopaBotAdapterContext,
    next: () => Promise<any>
) => Promise<any>

export type IopaEventHandlerArgs = (
    context: IopaBotAdapterContext,
    args: { [key: string]: any },
    next: () => Promise<any>
) => Promise<any>

export type IopaEventHandler = IopaEventHandlerNoArgs | IopaEventHandlerArgs

import {
    INVOKE_RESPONSE_KEY,
    URN_BOTADAPTER,
    AdapterCore,
} from './adapter-core'

import {
    AppBasedLinkQuery,
    ChannelInfo,
    FileConsentCardResponse,
    MessagingExtensionAction,
    MessagingExtensionActionResponse,
    MessagingExtensionQuery,
    MessagingExtensionResponse,
    O365ConnectorCardActionQuery,
    SigninStateVerificationQuery,
    TaskModuleRequest,
    TaskModuleResponse,
    TeamsChannelData,
    TeamInfo,
} from 'iopa-botadapter-schema-teams'

import { RouterApp, BotReading, BotActivityTypes } from 'iopa-types'

export class AdapterWithEvents extends AdapterCore implements IAdapterEvents {
    protected readonly handlers: { [type: string]: IopaEventHandler[] } = {}

    public constructor(app: RouterApp) {
        super(app)
        app.use(this.invokeEvents, 'iopa-botadapter.AdapterWithEvents')
    }

    //
    // MASTER INVOKE HANDLER
    //

    protected invokeEvents = async (
        context: IopaBotAdapterContext,
        next: () => Promise<void>
    ) => {
        if (context.botːSource !== URN_BOTADAPTER) {
            return next()
        }

        const { activity } = context.botːCapability

        switch (activity.type) {
            case ActivityTypes.Invoke:
                const invokeResponse = await this.invoke_TeamsInvokeActivity(
                    context
                )
                // If onInvokeActivity has already sent an InvokeResponse, do not send another one.
                if (
                    invokeResponse &&
                    !context.botːCapability.turnState.get(INVOKE_RESPONSE_KEY)
                ) {
                    await context.botːCapability.sendActivity({
                        value: invokeResponse,
                        type: ('invokeResponse' as unknown) as ActivityTypes,
                    })
                }
                break

            default:
                await this.emit('Turn', context, async () => {
                    switch (context.botːCapability.activity.type) {
                        case ActivityTypes.Message:
                            await this.invoke_MessageActivity(context)
                            break
                        case ActivityTypes.ConversationUpdate:
                            await this.invoke_ConversationUpdateActivity(
                                context
                            )
                            break
                        case ActivityTypes.MessageReaction:
                            await this.invoke_MessageReactionActivity(context)
                            break
                        case ActivityTypes.Event:
                            await this.invoke_EventActivity(context)
                            break
                        default:
                            await this.invoke_UnrecognizedActivity(context)
                            break
                    }
                })
                break
        }

        return next()
    }

    //
    // INVOKE SUBTYPE HANDLERS
    //

    protected async invoke_MessageActivity(
        context: IopaBotAdapterContext
    ): Promise<void> {
        const { activity, adapter } = context.botːCapability

        const mentions = adapter.getMentions(activity)

        if (mentions.length) {
            mentions.forEach((mention, i) => {
                activity.text = activity.text
                    .replace(
                        mention.text,
                        mention.mentioned.id == activity.recipient.id
                            ? ''
                            : '@' + mention.mentioned.id
                    )
                    .trim()
            })
        }

        context.botːText = activity.text // overwrite with updated mentions

        if (
            activity.channelId === 'msteams' &&
            activity &&
            activity.value &&
            !activity.textFormat &&
            !activity.attachments
        ) {
            await this.emit(
                'ActionInvoke',
                context,
                activity.value,
                this.defaultNextEvent(context)
            )
        } else {
            await this.emit('Message', context, this.defaultNextEvent(context))
        }
    }

    protected async invoke_ConversationUpdateActivity(
        context: IopaBotAdapterContext
    ): Promise<void> {
        const activity = context.botːCapability.activity
        await this.emit('ConversationUpdate', context, async () => {
            const channelData = activity.channelData as TeamsChannelData

            if (!channelData || !channelData.eventType) {
                if (activity.membersAdded && activity.membersAdded.length > 0) {
                    await this.emit(
                        'MembersAdded',
                        context,
                        this.defaultNextEvent(context)
                    )
                } else if (
                    activity.membersRemoved &&
                    activity.membersRemoved.length > 0
                ) {
                    await this.emit(
                        'MembersRemoved',
                        context,
                        this.defaultNextEvent(context)
                    )
                } else {
                    await this.defaultNextEvent(context)()
                }
            } else {
                switch (channelData.eventType) {
                    case 'teamMemberAdded':
                        return await this.invoke_TeamsMembersAdded(context)

                    case 'teamMemberRemoved':
                        return await this.invoke_TeamsMembersRemoved(context)

                    case 'channelCreated':
                        return await this.invoke_TeamsChannelCreated(context)

                    case 'channelDeleted':
                        return await this.invoke_TeamsChannelDeleted(context)

                    case 'channelRenamed':
                        return await this.invoke_TeamsChannelRenamed(context)

                    case 'teamRenamed':
                        return await this.invoke_TeamsTeamRenamed(context)

                    default:
                        if (
                            activity.membersAdded &&
                            activity.membersAdded.length > 0
                        ) {
                            await this.emit(
                                'MembersAdded',
                                context,
                                this.defaultNextEvent(context)
                            )
                        } else if (
                            activity.membersRemoved &&
                            activity.membersRemoved.length > 0
                        ) {
                            await this.emit(
                                'MembersRemoved',
                                context,
                                this.defaultNextEvent(context)
                            )
                        } else {
                            await this.defaultNextEvent(context)()
                        }
                }
            }
        })
    }

    protected async invoke_TeamsMembersAdded(
        context: IopaBotAdapterContext
    ): Promise<void> {
        if (
            'TeamsMembersAdded' in this.handlers &&
            this.handlers['TeamsMembersAdded'].length > 0
        ) {
            await this.emit(
                'TeamsMembersAdded',
                context,
                this.defaultNextEvent(context)
            )
        } else {
            await this.emit(
                'MembersAdded',
                context,
                this.defaultNextEvent(context)
            )
        }
    }

    protected async invoke_TeamsMembersRemoved(
        context: IopaBotAdapterContext
    ): Promise<void> {
        if (
            'TeamsMembersRemoved' in this.handlers &&
            this.handlers['TeamsMembersRemoved'].length > 0
        ) {
            await this.emit(
                'TeamsMembersRemoved',
                context,
                this.defaultNextEvent(context)
            )
        } else {
            await this.emit(
                'MembersRemoved',
                context,
                this.defaultNextEvent(context)
            )
        }
    }

    protected async invoke_TeamsChannelCreated(context): Promise<void> {
        await this.emit(
            'TeamsChannelCreated',
            context,
            this.defaultNextEvent(context)
        )
    }

    protected async invoke_TeamsChannelDeleted(context): Promise<void> {
        await this.emit(
            'TeamsChannelDeleted',
            context,
            this.defaultNextEvent(context)
        )
    }

    protected async invoke_TeamsChannelRenamed(context): Promise<void> {
        await this.emit(
            'TeamsChannelRenamed',
            context,
            this.defaultNextEvent(context)
        )
    }

    protected async invoke_TeamsTeamRenamed(context): Promise<void> {
        await this.emit(
            'TeamsTeamRenamed',
            context,
            this.defaultNextEvent(context)
        )
    }

    protected async invoke_MessageReactionActivity(
        context: IopaBotAdapterContext
    ): Promise<void> {
        const activity = context.botːCapability.activity
        await this.emit('MessageReaction', context, async () => {
            if (activity.reactionsAdded || activity.reactionsRemoved) {
                if (
                    activity.reactionsAdded &&
                    activity.reactionsAdded.length > 0
                ) {
                    await this.invoke_ReactionsAddedActivity(
                        activity.reactionsAdded,
                        context
                    )
                } else if (
                    activity.reactionsRemoved &&
                    activity.reactionsRemoved.length > 0
                ) {
                    await this.invoke_ReactionsRemovedActivity(
                        activity.reactionsRemoved,
                        context
                    )
                }
            } else {
                await this.defaultNextEvent(context)()
            }
        })
    }

    protected async invoke_EventActivity(
        context: IopaBotAdapterContext
    ): Promise<void> {
        const activity = context.botːCapability.activity
        await this.emit('Event', context, async () => {
            if (activity.name === 'tokens/response') {
                await this.emit(
                    'TokenResponseEvent',
                    context,
                    this.defaultNextEvent(context)
                )
            } else {
                await this.defaultNextEvent(context)()
            }
        })
    }

    protected async invoke_UnrecognizedActivity(
        context: IopaBotAdapterContext
    ): Promise<void> {
        await this.emit(
            'UnrecognizedActivityType',
            context,
            this.defaultNextEvent(context)
        )
    }

    protected async invoke_ReactionsAddedActivity(
        reactionsAdded: MessageReaction[],
        context: IopaBotAdapterContext
    ): Promise<void> {
        await this.emit(
            'ReactionsAdded',
            context,
            this.defaultNextEvent(context)
        )
    }

    protected async invoke_ReactionsRemovedActivity(
        reactionsRemoved: MessageReaction[],
        context: IopaBotAdapterContext
    ): Promise<void> {
        await this.emit(
            'ReactionsRemoved',
            context,
            this.defaultNextEvent(context)
        )
    }

    //
    // INTERNAL EVENT INFRASTRUCTURE
    //

    protected defaultNextEvent(
        context: IopaBotAdapterContext
    ): () => Promise<void> {
        const runDialogs = async (): Promise<void> => {
            if (!context.botːCapability.responded) {
                await this.emit('Dialog', context, async () => {
                    // noop
                })
            }
        }
        return runDialogs
    }

    protected on(type: string, handler: IopaEventHandler) {
        if (!this.handlers[type]) {
            this.handlers[type] = [handler]
        } else {
            this.handlers[type].push(handler)
        }
        return this
    }

    public emit(type: string, context: IopaBotAdapterContext): Promise<any>

    public emit(
        type: string,
        context: IopaBotAdapterContext,
        onNext: () => Promise<any>
    ): Promise<any>

    public emit(
        type: string,
        context: IopaBotAdapterContext,
        args: { [key: string]: any } | (() => Promise<any>),
        onNext?: () => Promise<any>
    ): Promise<any>

    async emit(
        type: BotActivityTypes,
        context: IopaBotAdapterContext,
        args?: { [key: string]: any },
        onNext?: () => Promise<any>
    ): Promise<any> {
        if (
            (type as any) !== 'Dialog' &&
            (type as any) !== 'ContextSendActivities'
        ) {
            context.botːActivityType = type
        }

        if (typeof args == 'function') {
            onNext = args as any
            args = null
        }

        let returnValue: any = null

        async function runHandler(index: number): Promise<void> {
            if (index < handlers.length) {
                const val = args
                    ? await (handlers[index] as IopaEventHandlerArgs)(
                          context,
                          args,
                          () => runHandler(index + 1)
                      )
                    : await (handlers[index] as IopaEventHandlerNoArgs)(
                          context,
                          () => runHandler(index + 1)
                      )

                // if a value is returned, and we have not yet set the return value,
                // capture it.  This is used to allow InvokeResponses to be returned.
                if (typeof val !== 'undefined' && returnValue === null) {
                    returnValue = val
                }
            } else if (onNext) {
                const val = await onNext()
                if (typeof val !== 'undefined') {
                    returnValue = val
                }
            }
        }

        const handlers = this.handlers[type] || []
        await runHandler(0)

        return returnValue
    }

    //
    // EVENT REGISTRATION PUBLIC METHODS
    //

    public onTurn(handler: IopaEventHandlerNoArgs): this {
        return this.on('Turn', handler)
    }

    public onMessage(handler: IopaEventHandlerNoArgs): this {
        return this.on('Message', handler)
    }

    /** Receives invoke activities where context.botːCapability.activity.name is empty */
    public onActionInvoke(
        handler: (
            context: IopaBotAdapterContext,
            value: any,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'ActionInvoke',
            async (context: IopaBotAdapterContext, value: any, next) => {
                await handler(context, value, next)
            }
        )
    }

    public onConversationUpdate(handler: IopaEventHandlerNoArgs): this {
        return this.on('ConversationUpdate', handler)
    }

    public onMembersAdded(handler: IopaEventHandlerNoArgs): this {
        return this.on('MembersAdded', handler)
    }

    public onMembersRemoved(handler: IopaEventHandlerNoArgs): this {
        return this.on('MembersRemoved', handler)
    }

    public onMessageReaction(handler: IopaEventHandlerNoArgs): this {
        return this.on('MessageReaction', handler)
    }

    public onReactionsAdded(handler: IopaEventHandlerNoArgs): this {
        return this.on('ReactionsAdded', handler)
    }

    public onReactionsRemoved(handler: IopaEventHandlerNoArgs): this {
        return this.on('ReactionsRemoved', handler)
    }

    public onEvent(handler: IopaEventHandlerNoArgs): this {
        return this.on('Event', handler)
    }

    public onTokenResponseEvent(handler: IopaEventHandlerNoArgs): this {
        return this.on('TokenResponseEvent', handler)
    }

    public onUnrecognizedActivityType(handler: IopaEventHandlerNoArgs): this {
        return this.on('UnrecognizedActivityType', handler)
    }

    public onDialog(handler: IopaEventHandlerNoArgs): this {
        return this.on('Dialog', handler)
    }

    public onTeamsMembersAddedEvent(
        handler: (
            context: IopaBotAdapterContext,
            membersAdded: ChannelAccount[],
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsMembersAdded',
            async (context: IopaBotAdapterContext, next) => {
                const teamsChannelData = context.botːCapability.activity
                    .channelData as TeamsChannelData
                await handler(
                    context,
                    context.botːCapability.activity.membersAdded,
                    teamsChannelData.team,
                    next
                )
            }
        )
    }

    public onTeamsMembersRemovedEvent(
        handler: (
            context: IopaBotAdapterContext,
            membersRemoved: ChannelAccount[],
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsMembersRemoved',
            async (context: IopaBotAdapterContext, next) => {
                const teamsChannelData = context.botːCapability.activity
                    .channelData as TeamsChannelData
                await handler(
                    context,
                    context.botːCapability.activity.membersRemoved,
                    teamsChannelData.team,
                    next
                )
            }
        )
    }

    public onTeamsChannelCreatedEvent(
        handler: (
            context: IopaBotAdapterContext,
            channelInfo: ChannelInfo,
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsChannelCreated',
            async (context: IopaBotAdapterContext, next) => {
                const teamsChannelData = context.botːCapability.activity
                    .channelData as TeamsChannelData
                await handler(
                    context,
                    teamsChannelData.channel,
                    teamsChannelData.team,
                    next
                )
            }
        )
    }

    public onTeamsChannelDeletedEvent(
        handler: (
            context: IopaBotAdapterContext,
            channelInfo: ChannelInfo,
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsChannelDeleted',
            async (context: IopaBotAdapterContext, next) => {
                const teamsChannelData = context.botːCapability.activity
                    .channelData as TeamsChannelData
                await handler(
                    context,
                    teamsChannelData.channel,
                    teamsChannelData.team,
                    next
                )
            }
        )
    }

    public onTeamsChannelRenamedEvent(
        handler: (
            context: IopaBotAdapterContext,
            channelInfo: ChannelInfo,
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsChannelRenamed',
            async (context: IopaBotAdapterContext, next) => {
                const teamsChannelData = context.botːCapability.activity
                    .channelData as TeamsChannelData
                await handler(
                    context,
                    teamsChannelData.channel,
                    teamsChannelData.team,
                    next
                )
            }
        )
    }

    public onTeamsTeamRenamedEvent(
        handler: (
            context: IopaBotAdapterContext,
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsTeamRenamed',
            async (context: IopaBotAdapterContext, next) => {
                const teamsChannelData = context.botːCapability.activity
                    .channelData as TeamsChannelData
                await handler(context, teamsChannelData.team, next)
            }
        )
    }

    protected async invoke_TeamsInvokeActivity(
        context: IopaBotAdapterContext
    ): Promise<InvokeResponse> {
        try {
            if (
                !context.botːCapability.activity.name &&
                context.botːCapability.activity.channelId === 'msteams'
            ) {
                return await this.emit('TeamsCardActionInvoke', context)
            } else {
                switch (context.botːCapability.activity.name) {
                    case 'signin/verifyState':
                        await this.emit('TeamsSigninVerifyState', context)
                        return this.createInvokeResponse()

                    case 'fileConsent/invoke':
                        return this.createInvokeResponse(
                            await this.emit('TeamsFileConsent', context)
                        )

                    case 'actionableMessage/executeAction':
                        await this.emit('TeamsO365ConnectorCardAction', context)
                        return this.createInvokeResponse()

                    case 'composeExtension/queryLink':
                        return this.createInvokeResponse(
                            this.emit('TeamsAppBasedLinkQuery', context)
                        )

                    case 'composeExtension/query':
                        return this.createInvokeResponse(
                            this.emit('TeamsMessagingExtensionQuery', context)
                        )

                    case 'composeExtension/selectItem':
                        return this.createInvokeResponse(
                            this.emit(
                                'TeamsMessagingExtensionSelectItem',
                                context
                            )
                        )

                    case 'composeExtension/submitAction':
                        const action: MessagingExtensionAction =
                            context.botːCapability.activity.value

                        if (action.botMessagePreviewAction) {
                            switch (action.botMessagePreviewAction) {
                                case 'edit':
                                    return this.createInvokeResponse(
                                        this.emit(
                                            'TeamsMessagingExtensionBotMessagePreviewEdit',
                                            context
                                        ) as MessagingExtensionActionResponse
                                    )
                                case 'send':
                                    return this.createInvokeResponse(
                                        this.emit(
                                            'TeamsMessagingExtensionBotMessagePreviewSend',
                                            context
                                        ) as MessagingExtensionActionResponse
                                    )
                                default:
                                    throw new Error('BadRequest')
                            }
                        } else {
                            return this.createInvokeResponse(
                                this.emit(
                                    'TeamsMessagingExtensionSubmitAction',
                                    context
                                ) as MessagingExtensionActionResponse
                            )
                        }

                    case 'composeExtension/fetchTask':
                        return this.createInvokeResponse(
                            this.emit(
                                'TeamsMessagingExtensionFetchTask',
                                context
                            )
                        )

                    case 'composeExtension/querySettingUrl':
                        return this.createInvokeResponse(
                            this.emit(
                                'TeamsMessagingExtensionConfigurationQuerySettingUrl',
                                context
                            )
                        )

                    case 'composeExtension/setting':
                        await this.emit(
                            'TeamsMessagingExtensionConfigurationSetting',
                            context
                        )
                        return this.createInvokeResponse()

                    case 'composeExtension/onCardButtonClicked':
                        await this.emit(
                            'TeamsMessagingExtensionCardButtonClicked',
                            context
                        )
                        return this.createInvokeResponse()

                    case 'task/fetch':
                        return this.createInvokeResponse(
                            this.emit('TeamsTaskModuleFetch', context)
                        )
                    case 'task/submit':
                        return this.createInvokeResponse(
                            this.emit('TeamsTaskModuleSubmit', context)
                        )
                    default:
                        throw new Error('NotImplemented')
                }
            }
        } catch (err) {
            if (err.message === 'NotImplemented') {
                return { status: 501 }
            } else if (err.message === 'BadRequest') {
                return { status: 400 }
            }
            throw err
        }
    }

    /** Receives invoke activities where context.botːCapability.activity.name is empty */
    public onTeamsCardActionInvoke(
        handler: (
            context: IopaBotAdapterContext,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsCardActionInvoke',
            async (context: IopaBotAdapterContext, next) => {
                await handler(context, next)
            }
        )
    }

    /** Receives invoke activities with Activity name of 'signin/verifyState' */
    public onTeamsSigninVerifyState(
        handler: (
            context: IopaBotAdapterContext,
            query: SigninStateVerificationQuery,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsSigninVerifyState',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with Activity name of 'fileConsent/invoke' */
    public onTeamsFileConsent(
        handler: (
            context: IopaBotAdapterContext,
            fileConsentCardResponse: FileConsentCardResponse,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsFileConsent',
            async (context: IopaBotAdapterContext, next) => {
                const fileConsentCardResponse = context.botːCapability.activity
                    .value as FileConsentCardResponse
                await handler(context, fileConsentCardResponse, async () => {
                    switch (fileConsentCardResponse.action) {
                        case 'accept':
                            return await this.emit(
                                'TeamsFileConsentAccept',
                                context,
                                next
                            )
                        case 'decline':
                            return await this.emit(
                                'TeamsFileConsentDecline',
                                context,
                                next
                            )
                        default:
                            throw new Error('BadRequest')
                    }
                })
            }
        )
    }

    /**  Receives invoke activities with Activity name of 'fileConsent/invoke' with confirmation from user */
    public onTeamsFileConsentAccept(
        handler: (
            context: IopaBotAdapterContext,
            fileConsentCardResponse: FileConsentCardResponse,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsFileConsentAccept',
            async (context: IopaBotAdapterContext, next) => {
                const fileConsentCardResponse = context.botːCapability.activity
                    .value as FileConsentCardResponse
                return await handler(context, fileConsentCardResponse, next)
            }
        )
    }

    /** Receives invoke activities with Activity name of 'fileConsent/invoke' with decline from user  */
    public onTeamsFileConsentDecline(
        handler: (
            context: IopaBotAdapterContext,
            fileConsentCardResponse: FileConsentCardResponse,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsFileConsentAccept',
            async (context: IopaBotAdapterContext, next) => {
                const fileConsentCardResponse = context.botːCapability.activity
                    .value as FileConsentCardResponse
                return await handler(context, fileConsentCardResponse, next)
            }
        )
    }

    /** Receives invoke activities with Activity name of 'actionableMessage/executeAction' */
    public onTeamsO365ConnectorCardAction(
        handler: (
            context: IopaBotAdapterContext,
            query: O365ConnectorCardActionQuery,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsO365ConnectorCardAction',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with Activity name of 'composeExtension/onCardButtonClicked' */
    public onTeamsMessagingExtensionCardButtonClicked(
        handler: (
            context: IopaBotAdapterContext,
            cardData: any,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsMessagingExtensionCardButtonClicked',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with Activity name of 'task/fetch' */
    public onTeamsTaskModuleFetch(
        handler: (
            context: IopaBotAdapterContext,
            taskModuleRequest: TaskModuleRequest,
            next: () => Promise<void>
        ) => Promise<TaskModuleResponse>
    ): this {
        return this.on(
            'TeamsTaskModuleFetch',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with Activity name of 'task/submit' */
    public onTeamsTaskModuleSubmit(
        handler: (
            context: IopaBotAdapterContext,
            taskModuleRequest: TaskModuleRequest,
            next: () => Promise<void>
        ) => Promise<TaskModuleResponse>
    ): this {
        return this.on(
            'TeamsTaskModuleSubmit',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with Activity name of 'composeExtension/queryLink'  */
    public onTeamsAppBasedLinkQuery(
        handler: (
            context: IopaBotAdapterContext,
            query: AppBasedLinkQuery,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsAppBasedLinkQuery',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with the name 'composeExtension/query' */
    public onTeamsMessagingExtensionQuery(
        handler: (
            context: IopaBotAdapterContext,
            query: MessagingExtensionQuery,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsMessagingExtensionQuery',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with the name 'composeExtension/selectItem'  */
    public onTeamsMessagingExtensionSelectItem(
        handler: (
            context: IopaBotAdapterContext,
            query: any,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsMessagingExtensionSelectItem',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with the name 'composeExtension/submitAction'  */
    public onTeamsMessagingExtensionSubmitAction(
        handler: (
            context: IopaBotAdapterContext,
            action: MessagingExtensionAction,
            next: () => Promise<void>
        ) => Promise<MessagingExtensionActionResponse>
    ): this {
        return this.on(
            'TeamsMessagingExtensionSubmitAction',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value  */
    public onTeamsMessagingExtensionBotMessagePreviewEdit(
        handler: (
            context: IopaBotAdapterContext,
            action: MessagingExtensionAction,
            next: () => Promise<void>
        ) => Promise<MessagingExtensionActionResponse>
    ): this {
        return this.on(
            'TeamsMessagingExtensionBotMessagePreviewEdit',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value.    */
    public onTeamsMessagingExtensionBotMessagePreviewSend(
        handler: (
            context: IopaBotAdapterContext,
            action: MessagingExtensionAction,
            next: () => Promise<void>
        ) => Promise<MessagingExtensionActionResponse>
    ): this {
        return this.on(
            'TeamsMessagingExtensionBotMessagePreviewSend',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with the name 'composeExtension/fetchTask' */
    public onTeamsMessagingExtensionFetchTask(
        handler: (
            context: IopaBotAdapterContext,
            action: MessagingExtensionAction,
            next: () => Promise<void>
        ) => Promise<MessagingExtensionActionResponse>
    ): this {
        return this.on(
            'TeamsMessagingExtensionFetchTask',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with the name 'composeExtension/querySettingUrl'   */
    public onTeamsMessagingExtensionConfigurationQuerySettingUrl(
        handler: (
            context: IopaBotAdapterContext,
            query: MessagingExtensionQuery,
            next: () => Promise<void>
        ) => Promise<MessagingExtensionResponse>
    ): this {
        return this.on(
            'TeamsMessagingExtensionConfigurationQuerySettingUrl',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /** Receives invoke activities with the name 'composeExtension/setting'   */
    public onTeamsMessagingExtensionConfigurationSetting(
        handler: (
            context: IopaBotAdapterContext,
            settings: any,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'TeamsMessagingExtensionConfigurationSetting',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    /**
     * Event pipeline invoked when a sendActivities is called on IopaBotAdapterContext;
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextSendActivities(
        handler: (
            context: IopaBotAdapterContext,
            activities: Partial<Activity>[],
            next: () => Promise<void>
        ) => Promise<ResourceResponse[]>
    ): this {
        return this.on(
            'ContextSendActivities',
            async (context: IopaBotAdapterContext, { activities }, next) => {
                return await handler(context, activities, next)
            }
        )
    }

    /**
     * Event pipeline invoked when a updateActivities is called on IopaBotAdapterContext
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextUpdateActivity(
        handler: (
            context: IopaBotAdapterContext,
            activity: Partial<Activity>,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'ContextUpdateActivity',
            async (context: IopaBotAdapterContext, { activity }, next) => {
                return await handler(context, activity, next)
            }
        )
    }

    /**
     * Event pipeline invoked when a updateActivities is called on IopaBotAdapterContext
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextDeleteActivity(
        handler: (
            context: IopaBotAdapterContext,
            reference: Partial<ConversationReference>,
            next: () => Promise<void>
        ) => Promise<void>
    ): this {
        return this.on(
            'ContextUpdateActivity',
            async (context: IopaBotAdapterContext, next) => {
                return await handler(
                    context,
                    context.botːCapability.activity.value,
                    next
                )
            }
        )
    }

    private createInvokeResponse(body?: any): InvokeResponse {
        return { status: 200, body }
    }
}
