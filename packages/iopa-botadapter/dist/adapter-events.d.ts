import { AdapterEvents as IAdapterEvents, IopaBotAdapterContext, InvokeResponse } from 'iopa-botadapter-types';
import { ChannelAccount, MessageReaction, Activity, ConversationReference, ResourceResponse } from 'iopa-botadapter-schema';
import { AppBasedLinkQuery, ChannelInfo, FileConsentCardResponse, MessagingExtensionAction, MessagingExtensionActionResponse, MessagingExtensionQuery, MessagingExtensionResponse, O365ConnectorCardActionQuery, SigninStateVerificationQuery, TaskModuleRequest, TaskModuleResponse, TeamInfo } from 'iopa-botadapter-schema-teams';
import { RouterApp, IopaBotContext } from 'iopa-types';
import { AdapterCore } from './adapter-core';
export declare type IopaEventHandlerNoArgs = (context: IopaBotAdapterContext, next: () => Promise<any>) => Promise<any>;
export declare type IopaEventHandlerArgs = (context: IopaBotAdapterContext, args: {
    [key: string]: any;
}, next: () => Promise<any>) => Promise<any>;
export declare type IopaEventHandler = IopaEventHandlerNoArgs | IopaEventHandlerArgs;
export declare class AdapterWithEvents extends AdapterCore implements IAdapterEvents {
    protected readonly handlers: {
        [type: string]: IopaEventHandler[];
    };
    constructor(app: RouterApp<{}, IopaBotContext>);
    protected invokeEvents: (context: IopaBotAdapterContext, next: () => Promise<void>) => Promise<void>;
    protected invokeMessageActivity(context: IopaBotAdapterContext): Promise<void>;
    protected invokeConversationUpdateActivity(context: IopaBotAdapterContext): Promise<void>;
    protected invokeTeamsMembersAdded(context: IopaBotAdapterContext): Promise<void>;
    protected invokeTeamsMembersRemoved(context: IopaBotAdapterContext): Promise<void>;
    protected invokeTeamsChannelCreated(context: any): Promise<void>;
    protected invokeTeamsChannelDeleted(context: any): Promise<void>;
    protected invokeTeamsChannelRenamed(context: any): Promise<void>;
    protected invokeTeamsTeamRenamed(context: any): Promise<void>;
    protected invokeMessageReactionActivity(context: IopaBotAdapterContext): Promise<void>;
    protected invokeEventActivity(context: IopaBotAdapterContext): Promise<void>;
    protected invokeUnrecognizedActivity(context: IopaBotAdapterContext): Promise<void>;
    protected invokeReactionsAddedActivity(reactionsAdded: MessageReaction[], context: IopaBotAdapterContext): Promise<void>;
    protected invokeReactionsRemovedActivity(reactionsRemoved: MessageReaction[], context: IopaBotAdapterContext): Promise<void>;
    protected defaultNextEvent(context: IopaBotAdapterContext): () => Promise<void>;
    protected on(type: string, handler: IopaEventHandler): this;
    emit(type: string, context: IopaBotAdapterContext): Promise<any>;
    emit(type: string, context: IopaBotAdapterContext, onNext: () => Promise<any>): Promise<any>;
    emit(type: string, context: IopaBotAdapterContext, args: {
        [key: string]: any;
    } | (() => Promise<any>), onNext?: () => Promise<any>): Promise<any>;
    onTurn(handler: IopaEventHandlerNoArgs): this;
    onMessage(handler: IopaEventHandlerNoArgs): this;
    /** Receives invoke activities where context["bot.Capability"].activity.name is empty */
    onActionInvoke(handler: (context: IopaBotAdapterContext, value: any, next: () => Promise<void>) => Promise<void>): this;
    onConversationUpdate(handler: IopaEventHandlerNoArgs): this;
    onMembersAdded(handler: IopaEventHandlerNoArgs): this;
    onMembersRemoved(handler: IopaEventHandlerNoArgs): this;
    onMessageReaction(handler: IopaEventHandlerNoArgs): this;
    onReactionsAdded(handler: IopaEventHandlerNoArgs): this;
    onReactionsRemoved(handler: IopaEventHandlerNoArgs): this;
    onEvent(handler: IopaEventHandlerNoArgs): this;
    onTokenResponseEvent(handler: IopaEventHandlerNoArgs): this;
    onUnrecognizedActivityType(handler: IopaEventHandlerNoArgs): this;
    onDialog(handler: IopaEventHandlerNoArgs): this;
    onTeamsMembersAddedEvent(handler: (context: IopaBotAdapterContext, membersAdded: ChannelAccount[], teamInfo: TeamInfo, next: () => Promise<void>) => Promise<void>): this;
    onTeamsMembersRemovedEvent(handler: (context: IopaBotAdapterContext, membersRemoved: ChannelAccount[], teamInfo: TeamInfo, next: () => Promise<void>) => Promise<void>): this;
    onTeamsChannelCreatedEvent(handler: (context: IopaBotAdapterContext, channelInfo: ChannelInfo, teamInfo: TeamInfo, next: () => Promise<void>) => Promise<void>): this;
    onTeamsChannelDeletedEvent(handler: (context: IopaBotAdapterContext, channelInfo: ChannelInfo, teamInfo: TeamInfo, next: () => Promise<void>) => Promise<void>): this;
    onTeamsChannelRenamedEvent(handler: (context: IopaBotAdapterContext, channelInfo: ChannelInfo, teamInfo: TeamInfo, next: () => Promise<void>) => Promise<void>): this;
    onTeamsTeamRenamedEvent(handler: (context: IopaBotAdapterContext, teamInfo: TeamInfo, next: () => Promise<void>) => Promise<void>): this;
    protected invokeTeamsInvokeActivity(context: IopaBotAdapterContext): Promise<InvokeResponse>;
    /** Receives invoke activities where context["bot.Capability"].activity.name is empty */
    onTeamsCardActionInvoke(handler: (context: IopaBotAdapterContext, next: () => Promise<void>) => Promise<void>): this;
    /** Receives invoke activities with Activity name of 'signin/verifyState' */
    onTeamsSigninVerifyState(handler: (context: IopaBotAdapterContext, query: SigninStateVerificationQuery, next: () => Promise<void>) => Promise<void>): this;
    /** Receives invoke activities with Activity name of 'fileConsent/invoke' */
    onTeamsFileConsent(handler: (context: IopaBotAdapterContext, fileConsentCardResponse: FileConsentCardResponse, next: () => Promise<void>) => Promise<void>): this;
    /**  Receives invoke activities with Activity name of 'fileConsent/invoke' with confirmation from user */
    onTeamsFileConsentAccept(handler: (context: IopaBotAdapterContext, fileConsentCardResponse: FileConsentCardResponse, next: () => Promise<void>) => Promise<void>): this;
    /** Receives invoke activities with Activity name of 'fileConsent/invoke' with decline from user  */
    onTeamsFileConsentDecline(handler: (context: IopaBotAdapterContext, fileConsentCardResponse: FileConsentCardResponse, next: () => Promise<void>) => Promise<void>): this;
    /** Receives invoke activities with Activity name of 'actionableMessage/executeAction' */
    onTeamsO365ConnectorCardAction(handler: (context: IopaBotAdapterContext, query: O365ConnectorCardActionQuery, next: () => Promise<void>) => Promise<void>): this;
    /** Receives invoke activities with Activity name of 'composeExtension/onCardButtonClicked' */
    onTeamsMessagingExtensionCardButtonClicked(handler: (context: IopaBotAdapterContext, cardData: any, next: () => Promise<void>) => Promise<void>): this;
    /** Receives invoke activities with Activity name of 'task/fetch' */
    onTeamsTaskModuleFetch(handler: (context: IopaBotAdapterContext, taskModuleRequest: TaskModuleRequest, next: () => Promise<void>) => Promise<TaskModuleResponse>): this;
    /** Receives invoke activities with Activity name of 'task/submit' */
    onTeamsTaskModuleSubmit(handler: (context: IopaBotAdapterContext, taskModuleRequest: TaskModuleRequest, next: () => Promise<void>) => Promise<TaskModuleResponse>): this;
    /** Receives invoke activities with Activity name of 'composeExtension/queryLink'  */
    onTeamsAppBasedLinkQuery(handler: (context: IopaBotAdapterContext, query: AppBasedLinkQuery, next: () => Promise<void>) => Promise<void>): this;
    /** Receives invoke activities with the name 'composeExtension/query' */
    onTeamsMessagingExtensionQuery(handler: (context: IopaBotAdapterContext, query: MessagingExtensionQuery, next: () => Promise<void>) => Promise<void>): this;
    /** Receives invoke activities with the name 'composeExtension/selectItem'  */
    onTeamsMessagingExtensionSelectItem(handler: (context: IopaBotAdapterContext, query: any, next: () => Promise<void>) => Promise<void>): this;
    /** Receives invoke activities with the name 'composeExtension/submitAction'  */
    onTeamsMessagingExtensionSubmitAction(handler: (context: IopaBotAdapterContext, action: MessagingExtensionAction, next: () => Promise<void>) => Promise<MessagingExtensionActionResponse>): this;
    /** Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value  */
    onTeamsMessagingExtensionBotMessagePreviewEdit(handler: (context: IopaBotAdapterContext, action: MessagingExtensionAction, next: () => Promise<void>) => Promise<MessagingExtensionActionResponse>): this;
    /** Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value.    */
    onTeamsMessagingExtensionBotMessagePreviewSend(handler: (context: IopaBotAdapterContext, action: MessagingExtensionAction, next: () => Promise<void>) => Promise<MessagingExtensionActionResponse>): this;
    /** Receives invoke activities with the name 'composeExtension/fetchTask' */
    onTeamsMessagingExtensionFetchTask(handler: (context: IopaBotAdapterContext, action: MessagingExtensionAction, next: () => Promise<void>) => Promise<MessagingExtensionActionResponse>): this;
    /** Receives invoke activities with the name 'composeExtension/querySettingUrl'   */
    onTeamsMessagingExtensionConfigurationQuerySettingUrl(handler: (context: IopaBotAdapterContext, query: MessagingExtensionQuery, next: () => Promise<void>) => Promise<MessagingExtensionResponse>): this;
    /** Receives invoke activities with the name 'composeExtension/setting'   */
    onTeamsMessagingExtensionConfigurationSetting(handler: (context: IopaBotAdapterContext, settings: any, next: () => Promise<void>) => Promise<void>): this;
    /**
     * Event pipeline invoked when a sendActivities is called on IopaBotAdapterContext;
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextSendActivities(handler: (context: IopaBotAdapterContext, activities: Partial<Activity>[], next: () => Promise<void>) => Promise<ResourceResponse[]>): this;
    /**
     * Event pipeline invoked when a updateActivities is called on IopaBotAdapterContext
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextUpdateActivity(handler: (context: IopaBotAdapterContext, activity: Partial<Activity>, next: () => Promise<void>) => Promise<void>): this;
    /**
     * Event pipeline invoked when a updateActivities is called on IopaBotAdapterContext
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextDeleteActivity(handler: (context: IopaBotAdapterContext, reference: Partial<ConversationReference>, next: () => Promise<void>) => Promise<void>): this;
    private createInvokeResponse;
}
