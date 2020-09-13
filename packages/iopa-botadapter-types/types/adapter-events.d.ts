import {
    BotAdapterApp,
    IopaBotAdapterContext,
    InvokeResponse,
} from 'iopa-botadapter-types'

import {
    ChannelAccount,
    MessageReaction,
    Activity,
    ResourceResponse,
    ConversationReference,
} from 'iopa-botadapter-schema'

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
    TeamInfo,
} from 'iopa-botadapter-schema-teams'

export declare type IopaHandler = (
    context: IopaBotAdapterContext,
    next: () => Promise<any>
) => Promise<any>

export declare class AdapterEvents {
    /**
     * Bind a handler to the Turn event that is fired for every incoming activity, regardless of type
     * @remarks
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onTurn(handler: IopaHandler): this

    /**
     * Receives all incoming Message activities except Adaptive Cards invokes
     * @remarks
     * Message activities represent content intended to be shown within a conversational interface.
     * Message activities may contain text, speech, interactive cards, and binary or unknown attachments.
     * Note that while most messages do contain text, this field is not always present!
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onMessage(handler: IopaHandler): this

    /**
     * Receives all incoming Adaptive Cards actions
     * @remarks
     * Message activities represent content intended to be shown within a conversational interface.
     * Message activities may contain text, speech, interactive cards, and binary or unknown attachments.
     * Note that while most messages do contain text, this field is not always present!
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onActionInvoke(
        handler: (
            context: IopaBotAdapterContext,
            value: any,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /**
     * Receives all ConversationUpdate activities, regardless of whether members were added or removed
     * @remarks
     * Conversation update activities describe a change in a conversation's members, description, existence, or otherwise.
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onConversationUpdate(handler: IopaHandler): this

    /**
     * Receives only ConversationUpdate activities representing members being added.
     * @remarks
     * context.activity.membersAdded will include at least one entry.
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onMembersAdded(handler: IopaHandler): this

    /**
     * Receives only ConversationUpdate activities representing members being removed.
     * @remarks
     * context.activity.membersRemoved will include at least one entry.
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onMembersRemoved(handler: IopaHandler): this

    /**
     * Receives only MessageReaction activities, regardless of whether message reactions were added or removed
     * @remarks
     * MessageReaction activities are sent to the bot when a message reacion, such as 'like' or 'sad' are
     * associated with an activity previously sent from the bot.
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onMessageReaction(handler: IopaHandler): this

    /**
     * Receives only MessageReaction activities representing message reactions being added.
     * @remarks
     * context.activity.reactionsAdded will include at least one entry.
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onReactionsAdded(handler: IopaHandler): this

    /**
     * Receives only MessageReaction activities representing message reactions being removed.
     * @remarks
     * context.activity.reactionsRemoved will include at least one entry.
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onReactionsRemoved(handler: IopaHandler): this

    /**
     * Receives all Event activities.
     * @remarks
     * Event activities communicate programmatic information from a client or channel to a bot.
     * The meaning of an event activity is defined by the `name` field.
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onEvent(handler: IopaHandler): this

    /**
     * Receives event activities of type 'tokens/response'
     * @remarks
     * These events occur during the oauth flow
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onTokenResponseEvent(handler: IopaHandler): this

    /**
     * UnrecognizedActivityType will fire if an activity is received with a type that has not previously been defined.
     * @remarks
     * Some channels or custom adapters may create Actitivies with different, "unofficial" types.
     * These events will be passed through as UnrecognizedActivityType events.
     * Check `context.activity.type` for the type value.
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onUnrecognizedActivityType(handler: IopaHandler): this

    /**
     * onDialog fires at the end of the event emission process, and should be used to handle Dialog activity.
     * @remarks
     * Sample code:
     * ```javascript
     * bot.onDialog(async (context, next) => {
     *      if (context.activity.type === ActivityTypes.Message) {
     *          const dialogContext = await dialogSet.createContext(context);
     *          const results = await dialogContext.continueDialog();
     *          await conversationState.saveChanges(context);
     *      }
     *
     *      await next();
     * });
     * ```
     * @param handler BotHandler A handler function in the form async(context, next) => { ... }
     */
    onDialog(handler: IopaHandler): this

    //
    //  Microsoft Teams specific events
    //

    /**
     * Receives only ConversationUpdate activities representing Teams members being added.
     * @remarks
     * context.activity.membersAdded will include at least one entry.
     */
    onTeamsMembersAddedEvent(
        handler: (
            context: IopaBotAdapterContext,
            membersAdded: ChannelAccount[],
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /**
     * Receives only ConversationUpdate activities representing Teams members being removed.
     * @remarks
     * context.activity.membersRemoved will include at least one entry.
     */
    onTeamsMembersRemovedEvent(
        handler: (
            context: IopaBotAdapterContext,
            membersRemoved: ChannelAccount[],
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    onTeamsChannelCreatedEvent(
        handler: (
            context: IopaBotAdapterContext,
            channelInfo: ChannelInfo,
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    onTeamsChannelDeletedEvent(
        handler: (
            context: IopaBotAdapterContext,
            channelInfo: ChannelInfo,
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    onTeamsChannelRenamedEvent(
        handler: (
            context: IopaBotAdapterContext,
            channelInfo: ChannelInfo,
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    onTeamsTeamRenamedEvent(
        handler: (
            context: IopaBotAdapterContext,
            teamInfo: TeamInfo,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /** Receives invoke activities where context.activity.name is empty */
    onTeamsCardActionInvoke(
        handler: (
            context: IopaBotAdapterContext,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /** Receives invoke activities with Activity name of 'signin/verifyState' */
    onTeamsSigninVerifyState(
        handler: (
            context: IopaBotAdapterContext,
            query: SigninStateVerificationQuery,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /** Receives invoke activities with Activity name of 'fileConsent/invoke' */
    onTeamsFileConsent(
        handler: (
            context: IopaBotAdapterContext,
            fileConsentCardResponse: FileConsentCardResponse,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /**  Receives invoke activities with Activity name of 'fileConsent/invoke' with confirmation from user */
    onTeamsFileConsentAccept(
        handler: (
            context: IopaBotAdapterContext,
            fileConsentCardResponse: FileConsentCardResponse,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /** Receives invoke activities with Activity name of 'fileConsent/invoke' with decline from user  */
    onTeamsFileConsentDecline(
        handler: (
            context: IopaBotAdapterContext,
            fileConsentCardResponse: FileConsentCardResponse,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /** Receives invoke activities with Activity name of 'actionableMessage/executeAction' */
    onTeamsO365ConnectorCardAction(
        handler: (
            context: IopaBotAdapterContext,
            query: O365ConnectorCardActionQuery,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /** Receives invoke activities with Activity name of 'composeExtension/onCardButtonClicked' */
    onTeamsMessagingExtensionCardButtonClicked(
        handler: (
            context: IopaBotAdapterContext,
            cardData: any,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /** Receives invoke activities with Activity name of 'task/fetch' */
    onTeamsTaskModuleFetch(
        handler: (
            context: IopaBotAdapterContext,
            taskModuleRequest: TaskModuleRequest,
            next: () => Promise<void>
        ) => Promise<TaskModuleResponse>
    ): this

    /** Receives invoke activities with Activity name of 'task/submit' */
    onTeamsTaskModuleSubmit(
        handler: (
            context: IopaBotAdapterContext,
            taskModuleRequest: TaskModuleRequest,
            next: () => Promise<void>
        ) => Promise<TaskModuleResponse>
    ): this

    /** Receives invoke activities with Activity name of 'composeExtension/queryLink'  */
    onTeamsAppBasedLinkQuery(
        handler: (
            context: IopaBotAdapterContext,
            query: AppBasedLinkQuery,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /** Receives invoke activities with the name 'composeExtension/query' */
    onTeamsMessagingExtensionQuery(
        handler: (
            context: IopaBotAdapterContext,
            query: MessagingExtensionQuery,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /** Receives invoke activities with the name 'composeExtension/selectItem'  */
    onTeamsMessagingExtensionSelectItem(
        handler: (
            context: IopaBotAdapterContext,
            query: any,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    /** Receives invoke activities with the name 'composeExtension/submitAction'  */
    onTeamsMessagingExtensionSubmitAction(
        handler: (
            context: IopaBotAdapterContext,
            action: MessagingExtensionAction,
            next: () => Promise<void>
        ) => Promise<MessagingExtensionActionResponse>
    ): this

    /** Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value  */
    onTeamsMessagingExtensionBotMessagePreviewEdit(
        handler: (
            context: IopaBotAdapterContext,
            action: MessagingExtensionAction,
            next: () => Promise<void>
        ) => Promise<MessagingExtensionActionResponse>
    ): this

    /** Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value.    */
    onTeamsMessagingExtensionBotMessagePreviewSend(
        handler: (
            context: IopaBotAdapterContext,
            action: MessagingExtensionAction,
            next: () => Promise<void>
        ) => Promise<MessagingExtensionActionResponse>
    ): this

    /** Receives invoke activities with the name 'composeExtension/fetchTask' */
    onTeamsMessagingExtensionFetchTask(
        handler: (
            context: IopaBotAdapterContext,
            action: MessagingExtensionAction,
            next: () => Promise<void>
        ) => Promise<MessagingExtensionActionResponse>
    ): this

    /** Receives invoke activities with the name 'composeExtension/querySettingUrl'   */
    onTeamsMessagingExtensionConfigurationQuerySettingUrl(
        handler: (
            context: IopaBotAdapterContext,
            query: MessagingExtensionQuery,
            next: () => Promise<void>
        ) => Promise<MessagingExtensionResponse>
    ): this

    /** Receives invoke activities with the name 'composeExtension/setting'   */
    onTeamsMessagingExtensionConfigurationSetting(
        handler: (
            context: IopaBotAdapterContext,
            settings: any,
            next: () => Promise<void>
        ) => Promise<void>
    ): this

    //
    // Context outbound hooks
    //

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
    ): this

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
    ): this

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
    ): this

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
}
