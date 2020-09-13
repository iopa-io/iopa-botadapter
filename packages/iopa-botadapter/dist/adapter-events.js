import { ActivityTypes, } from 'iopa-botadapter-schema';
import { INVOKE_RESPONSE_KEY, URN_BOTADAPTER, AdapterCore, } from './adapter-core';
export class AdapterWithEvents extends AdapterCore {
    constructor(app) {
        super(app);
        this.handlers = {};
        //
        // MASTER INVOKE HANDLER
        //
        this.invokeEvents = async (context, next) => {
            if (context['bot.Source'] !== URN_BOTADAPTER) {
                return next();
            }
            const { activity } = context['bot.Capability'];
            switch (activity.type) {
                case ActivityTypes.Invoke:
                    const invokeResponse = await this.invokeTeamsInvokeActivity(context);
                    // If onInvokeActivity has already sent an InvokeResponse, do not send another one.
                    if (invokeResponse &&
                        !context['bot.Capability'].turnState.get(INVOKE_RESPONSE_KEY)) {
                        await context['bot.Capability'].sendActivity({
                            value: invokeResponse,
                            type: 'invokeResponse',
                        });
                    }
                    break;
                default:
                    await this.emit('Turn', context, async () => {
                        switch (context['bot.Capability'].activity.type) {
                            case ActivityTypes.Message:
                                await this.invokeMessageActivity(context);
                                break;
                            case ActivityTypes.ConversationUpdate:
                                await this.invokeConversationUpdateActivity(context);
                                break;
                            case ActivityTypes.MessageReaction:
                                await this.invokeMessageReactionActivity(context);
                                break;
                            case ActivityTypes.Event:
                                await this.invokeEventActivity(context);
                                break;
                            default:
                                await this.invokeUnrecognizedActivity(context);
                                break;
                        }
                    });
                    break;
            }
            return next();
        };
        app.use(this.invokeEvents, 'iopa-botadapter.AdapterWithEvents');
    }
    //
    // INVOKE SUBTYPE HANDLERS
    //
    async invokeMessageActivity(context) {
        const { activity, adapter } = context['bot.Capability'];
        const mentions = adapter.getMentions(activity);
        if (mentions.length) {
            mentions.forEach((mention, i) => {
                activity.text = activity.text
                    .replace(mention.text, mention.mentioned.id === activity.recipient.id
                    ? ''
                    : `@${mention.mentioned.id}`)
                    .trim();
            });
        }
        context['bot.Text'] = activity.text; // overwrite with updated mentions
        if (activity.channelId === 'msteams' &&
            activity &&
            activity.value &&
            !activity.textFormat &&
            !activity.attachments) {
            await this.emit('ActionInvoke', context, activity.value, this.defaultNextEvent(context));
        }
        else {
            await this.emit('Message', context, this.defaultNextEvent(context));
        }
    }
    async invokeConversationUpdateActivity(context) {
        const { activity } = context['bot.Capability'];
        await this.emit('ConversationUpdate', context, async () => {
            const channelData = activity.channelData;
            if (!channelData || !channelData.eventType) {
                if (activity.membersAdded && activity.membersAdded.length > 0) {
                    await this.emit('MembersAdded', context, this.defaultNextEvent(context));
                }
                else if (activity.membersRemoved &&
                    activity.membersRemoved.length > 0) {
                    await this.emit('MembersRemoved', context, this.defaultNextEvent(context));
                }
                else {
                    await this.defaultNextEvent(context)();
                }
            }
            else {
                switch (channelData.eventType) {
                    case 'teamMemberAdded':
                        await this.invokeTeamsMembersAdded(context);
                        return;
                    case 'teamMemberRemoved':
                        await this.invokeTeamsMembersRemoved(context);
                        return;
                    case 'channelCreated':
                        await this.invokeTeamsChannelCreated(context);
                        return;
                    case 'channelDeleted':
                        await this.invokeTeamsChannelDeleted(context);
                        return;
                    case 'channelRenamed':
                        await this.invokeTeamsChannelRenamed(context);
                        return;
                    case 'teamRenamed':
                        await this.invokeTeamsTeamRenamed(context);
                        return;
                    default:
                        if (activity.membersAdded &&
                            activity.membersAdded.length > 0) {
                            await this.emit('MembersAdded', context, this.defaultNextEvent(context));
                        }
                        else if (activity.membersRemoved &&
                            activity.membersRemoved.length > 0) {
                            await this.emit('MembersRemoved', context, this.defaultNextEvent(context));
                        }
                        else {
                            await this.defaultNextEvent(context)();
                        }
                }
            }
        });
    }
    async invokeTeamsMembersAdded(context) {
        if ('TeamsMembersAdded' in this.handlers &&
            this.handlers.TeamsMembersAdded.length > 0) {
            await this.emit('TeamsMembersAdded', context, this.defaultNextEvent(context));
        }
        else {
            await this.emit('MembersAdded', context, this.defaultNextEvent(context));
        }
    }
    async invokeTeamsMembersRemoved(context) {
        if ('TeamsMembersRemoved' in this.handlers &&
            this.handlers.TeamsMembersRemoved.length > 0) {
            await this.emit('TeamsMembersRemoved', context, this.defaultNextEvent(context));
        }
        else {
            await this.emit('MembersRemoved', context, this.defaultNextEvent(context));
        }
    }
    async invokeTeamsChannelCreated(context) {
        await this.emit('TeamsChannelCreated', context, this.defaultNextEvent(context));
    }
    async invokeTeamsChannelDeleted(context) {
        await this.emit('TeamsChannelDeleted', context, this.defaultNextEvent(context));
    }
    async invokeTeamsChannelRenamed(context) {
        await this.emit('TeamsChannelRenamed', context, this.defaultNextEvent(context));
    }
    async invokeTeamsTeamRenamed(context) {
        await this.emit('TeamsTeamRenamed', context, this.defaultNextEvent(context));
    }
    async invokeMessageReactionActivity(context) {
        const { activity } = context['bot.Capability'];
        await this.emit('MessageReaction', context, async () => {
            if (activity.reactionsAdded || activity.reactionsRemoved) {
                if (activity.reactionsAdded &&
                    activity.reactionsAdded.length > 0) {
                    await this.invokeReactionsAddedActivity(activity.reactionsAdded, context);
                }
                else if (activity.reactionsRemoved &&
                    activity.reactionsRemoved.length > 0) {
                    await this.invokeReactionsRemovedActivity(activity.reactionsRemoved, context);
                }
            }
            else {
                await this.defaultNextEvent(context)();
            }
        });
    }
    async invokeEventActivity(context) {
        const { activity } = context['bot.Capability'];
        await this.emit('Event', context, async () => {
            if (activity.name === 'tokens/response') {
                await this.emit('TokenResponseEvent', context, this.defaultNextEvent(context));
            }
            else {
                await this.defaultNextEvent(context)();
            }
        });
    }
    async invokeUnrecognizedActivity(context) {
        await this.emit('UnrecognizedActivityType', context, this.defaultNextEvent(context));
    }
    async invokeReactionsAddedActivity(reactionsAdded, context) {
        await this.emit('ReactionsAdded', context, this.defaultNextEvent(context));
    }
    async invokeReactionsRemovedActivity(reactionsRemoved, context) {
        await this.emit('ReactionsRemoved', context, this.defaultNextEvent(context));
    }
    //
    // INTERNAL EVENT INFRASTRUCTURE
    //
    defaultNextEvent(context) {
        const runDialogs = async () => {
            if (!context['bot.Capability'].responded) {
                await this.emit('Dialog', context, async () => {
                    // noop
                });
            }
        };
        return runDialogs;
    }
    on(type, handler) {
        if (!this.handlers[type]) {
            this.handlers[type] = [handler];
        }
        else {
            this.handlers[type].push(handler);
        }
        return this;
    }
    async emit(type, context, args, onNext) {
        if (type !== 'Dialog' &&
            type !== 'ContextSendActivities') {
            context['bot.ActivityType'] = type;
        }
        if (typeof args === 'function') {
            onNext = args;
            args = null;
        }
        let returnValue = null;
        async function runHandler(index) {
            if (index < handlers.length) {
                const val = args
                    ? await handlers[index](context, args, () => runHandler(index + 1))
                    : await handlers[index](context, () => runHandler(index + 1));
                // if a value is returned, and we have not yet set the return value,
                // capture it.  This is used to allow InvokeResponses to be returned.
                if (typeof val !== 'undefined' && returnValue === null) {
                    returnValue = val;
                }
            }
            else if (onNext) {
                const val = await onNext();
                if (typeof val !== 'undefined') {
                    returnValue = val;
                }
            }
        }
        const handlers = this.handlers[type] || [];
        await runHandler(0);
        return returnValue;
    }
    //
    // EVENT REGISTRATION PUBLIC METHODS
    //
    onTurn(handler) {
        return this.on('Turn', handler);
    }
    onMessage(handler) {
        return this.on('Message', handler);
    }
    /** Receives invoke activities where context["bot.Capability"].activity.name is empty */
    onActionInvoke(handler) {
        return this.on('ActionInvoke', async (context, value, next) => {
            await handler(context, value, next);
        });
    }
    onConversationUpdate(handler) {
        return this.on('ConversationUpdate', handler);
    }
    onMembersAdded(handler) {
        return this.on('MembersAdded', handler);
    }
    onMembersRemoved(handler) {
        return this.on('MembersRemoved', handler);
    }
    onMessageReaction(handler) {
        return this.on('MessageReaction', handler);
    }
    onReactionsAdded(handler) {
        return this.on('ReactionsAdded', handler);
    }
    onReactionsRemoved(handler) {
        return this.on('ReactionsRemoved', handler);
    }
    onEvent(handler) {
        return this.on('Event', handler);
    }
    onTokenResponseEvent(handler) {
        return this.on('TokenResponseEvent', handler);
    }
    onUnrecognizedActivityType(handler) {
        return this.on('UnrecognizedActivityType', handler);
    }
    onDialog(handler) {
        return this.on('Dialog', handler);
    }
    onTeamsMembersAddedEvent(handler) {
        return this.on('TeamsMembersAdded', async (context, next) => {
            const teamsChannelData = context['bot.Capability'].activity
                .channelData;
            await handler(context, context['bot.Capability'].activity.membersAdded, teamsChannelData.team, next);
        });
    }
    onTeamsMembersRemovedEvent(handler) {
        return this.on('TeamsMembersRemoved', async (context, next) => {
            const teamsChannelData = context['bot.Capability'].activity
                .channelData;
            await handler(context, context['bot.Capability'].activity.membersRemoved, teamsChannelData.team, next);
        });
    }
    onTeamsChannelCreatedEvent(handler) {
        return this.on('TeamsChannelCreated', async (context, next) => {
            const teamsChannelData = context['bot.Capability'].activity
                .channelData;
            await handler(context, teamsChannelData.channel, teamsChannelData.team, next);
        });
    }
    onTeamsChannelDeletedEvent(handler) {
        return this.on('TeamsChannelDeleted', async (context, next) => {
            const teamsChannelData = context['bot.Capability'].activity
                .channelData;
            await handler(context, teamsChannelData.channel, teamsChannelData.team, next);
        });
    }
    onTeamsChannelRenamedEvent(handler) {
        return this.on('TeamsChannelRenamed', async (context, next) => {
            const teamsChannelData = context['bot.Capability'].activity
                .channelData;
            await handler(context, teamsChannelData.channel, teamsChannelData.team, next);
        });
    }
    onTeamsTeamRenamedEvent(handler) {
        return this.on('TeamsTeamRenamed', async (context, next) => {
            const teamsChannelData = context['bot.Capability'].activity
                .channelData;
            await handler(context, teamsChannelData.team, next);
        });
    }
    async invokeTeamsInvokeActivity(context) {
        try {
            if (!context['bot.Capability'].activity.name &&
                context['bot.Capability'].activity.channelId === 'msteams') {
                return await this.emit('TeamsCardActionInvoke', context);
            }
            switch (context['bot.Capability'].activity.name) {
                case 'signin/verifyState':
                    await this.emit('TeamsSigninVerifyState', context);
                    return this.createInvokeResponse();
                case 'fileConsent/invoke':
                    return this.createInvokeResponse(await this.emit('TeamsFileConsent', context));
                case 'actionableMessage/executeAction':
                    await this.emit('TeamsO365ConnectorCardAction', context);
                    return this.createInvokeResponse();
                case 'composeExtension/queryLink':
                    return this.createInvokeResponse(this.emit('TeamsAppBasedLinkQuery', context));
                case 'composeExtension/query':
                    return this.createInvokeResponse(this.emit('TeamsMessagingExtensionQuery', context));
                case 'composeExtension/selectItem':
                    return this.createInvokeResponse(this.emit('TeamsMessagingExtensionSelectItem', context));
                case 'composeExtension/submitAction':
                    const action = context['bot.Capability'].activity.value;
                    if (action.botMessagePreviewAction) {
                        switch (action.botMessagePreviewAction) {
                            case 'edit':
                                return this.createInvokeResponse(this.emit('TeamsMessagingExtensionBotMessagePreviewEdit', context));
                            case 'send':
                                return this.createInvokeResponse(this.emit('TeamsMessagingExtensionBotMessagePreviewSend', context));
                            default:
                                throw new Error('BadRequest');
                        }
                    }
                    else {
                        return this.createInvokeResponse(this.emit('TeamsMessagingExtensionSubmitAction', context));
                    }
                case 'composeExtension/fetchTask':
                    return this.createInvokeResponse(this.emit('TeamsMessagingExtensionFetchTask', context));
                case 'composeExtension/querySettingUrl':
                    return this.createInvokeResponse(this.emit('TeamsMessagingExtensionConfigurationQuerySettingUrl', context));
                case 'composeExtension/setting':
                    await this.emit('TeamsMessagingExtensionConfigurationSetting', context);
                    return this.createInvokeResponse();
                case 'composeExtension/onCardButtonClicked':
                    await this.emit('TeamsMessagingExtensionCardButtonClicked', context);
                    return this.createInvokeResponse();
                case 'task/fetch':
                    return this.createInvokeResponse(this.emit('TeamsTaskModuleFetch', context));
                case 'task/submit':
                    return this.createInvokeResponse(this.emit('TeamsTaskModuleSubmit', context));
                default:
                    throw new Error('NotImplemented');
            }
        }
        catch (err) {
            if (err.message === 'NotImplemented') {
                return { status: 501 };
            }
            if (err.message === 'BadRequest') {
                return { status: 400 };
            }
            throw err;
        }
    }
    /** Receives invoke activities where context["bot.Capability"].activity.name is empty */
    onTeamsCardActionInvoke(handler) {
        return this.on('TeamsCardActionInvoke', async (context, next) => {
            await handler(context, next);
        });
    }
    /** Receives invoke activities with Activity name of 'signin/verifyState' */
    onTeamsSigninVerifyState(handler) {
        return this.on('TeamsSigninVerifyState', async (context, next) => {
            await handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with Activity name of 'fileConsent/invoke' */
    onTeamsFileConsent(handler) {
        return this.on('TeamsFileConsent', async (context, next) => {
            const fileConsentCardResponse = context['bot.Capability']
                .activity.value;
            await handler(context, fileConsentCardResponse, async () => {
                switch (fileConsentCardResponse.action) {
                    case 'accept':
                        return this.emit('TeamsFileConsentAccept', context, next);
                    case 'decline':
                        return this.emit('TeamsFileConsentDecline', context, next);
                    default:
                        throw new Error('BadRequest');
                }
            });
        });
    }
    /**  Receives invoke activities with Activity name of 'fileConsent/invoke' with confirmation from user */
    onTeamsFileConsentAccept(handler) {
        return this.on('TeamsFileConsentAccept', async (context, next) => {
            const fileConsentCardResponse = context['bot.Capability']
                .activity.value;
            return handler(context, fileConsentCardResponse, next);
        });
    }
    /** Receives invoke activities with Activity name of 'fileConsent/invoke' with decline from user  */
    onTeamsFileConsentDecline(handler) {
        return this.on('TeamsFileConsentAccept', async (context, next) => {
            const fileConsentCardResponse = context['bot.Capability']
                .activity.value;
            return handler(context, fileConsentCardResponse, next);
        });
    }
    /** Receives invoke activities with Activity name of 'actionableMessage/executeAction' */
    onTeamsO365ConnectorCardAction(handler) {
        return this.on('TeamsO365ConnectorCardAction', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with Activity name of 'composeExtension/onCardButtonClicked' */
    onTeamsMessagingExtensionCardButtonClicked(handler) {
        return this.on('TeamsMessagingExtensionCardButtonClicked', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with Activity name of 'task/fetch' */
    onTeamsTaskModuleFetch(handler) {
        return this.on('TeamsTaskModuleFetch', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with Activity name of 'task/submit' */
    onTeamsTaskModuleSubmit(handler) {
        return this.on('TeamsTaskModuleSubmit', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with Activity name of 'composeExtension/queryLink'  */
    onTeamsAppBasedLinkQuery(handler) {
        return this.on('TeamsAppBasedLinkQuery', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with the name 'composeExtension/query' */
    onTeamsMessagingExtensionQuery(handler) {
        return this.on('TeamsMessagingExtensionQuery', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with the name 'composeExtension/selectItem'  */
    onTeamsMessagingExtensionSelectItem(handler) {
        return this.on('TeamsMessagingExtensionSelectItem', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with the name 'composeExtension/submitAction'  */
    onTeamsMessagingExtensionSubmitAction(handler) {
        return this.on('TeamsMessagingExtensionSubmitAction', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value  */
    onTeamsMessagingExtensionBotMessagePreviewEdit(handler) {
        return this.on('TeamsMessagingExtensionBotMessagePreviewEdit', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with the name 'composeExtension/submitAction' with the 'botMessagePreview' property present on activity.value.    */
    onTeamsMessagingExtensionBotMessagePreviewSend(handler) {
        return this.on('TeamsMessagingExtensionBotMessagePreviewSend', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with the name 'composeExtension/fetchTask' */
    onTeamsMessagingExtensionFetchTask(handler) {
        return this.on('TeamsMessagingExtensionFetchTask', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with the name 'composeExtension/querySettingUrl'   */
    onTeamsMessagingExtensionConfigurationQuerySettingUrl(handler) {
        return this.on('TeamsMessagingExtensionConfigurationQuerySettingUrl', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /** Receives invoke activities with the name 'composeExtension/setting'   */
    onTeamsMessagingExtensionConfigurationSetting(handler) {
        return this.on('TeamsMessagingExtensionConfigurationSetting', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    /**
     * Event pipeline invoked when a sendActivities is called on IopaBotAdapterContext;
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextSendActivities(handler) {
        return this.on('ContextSendActivities', async (context, { activities }, next) => {
            return handler(context, activities, next);
        });
    }
    /**
     * Event pipeline invoked when a updateActivities is called on IopaBotAdapterContext
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextUpdateActivity(handler) {
        return this.on('ContextUpdateActivity', async (context, { activity }, next) => {
            return handler(context, activity, next);
        });
    }
    /**
     * Event pipeline invoked when a updateActivities is called on IopaBotAdapterContext
     * it allows for manipulation of the result, pre and post the next() call
     */
    onContextDeleteActivity(handler) {
        return this.on('ContextUpdateActivity', async (context, next) => {
            return handler(context, context['bot.Capability'].activity.value, next);
        });
    }
    createInvokeResponse(body) {
        return { status: 200, body };
    }
}
//# sourceMappingURL=adapter-events.js.map