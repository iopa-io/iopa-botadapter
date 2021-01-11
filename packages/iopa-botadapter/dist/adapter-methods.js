import { ActivityTypes, } from 'iopa-botadapter-schema';
import { HttpAuthAppCredentials } from 'iopa-botadapter-schema-auth';
import { shallowCopy } from './util';
import { AdapterWithEvents } from './adapter-events';
export class AdapterWithEventsAndMethods extends AdapterWithEvents {
    // eslint-disable-next-line no-useless-constructor
    constructor(app) {
        super(app);
        /** noop, needed for IOPA app.use */
    }
    /**
     * Rewrites the activity text without any at mention.
     * Use with caution because this function is altering the text on the Activity.
     */
    removeRecipientMention(activity) {
        return this.removeMentionText(activity, activity.recipient.id);
    }
    /**
     * Remove any mention text for given id from the Activity.Text property.  For example, given the message
     * "@echoBot Hi Bot", this will remove "@echoBot", leaving "Hi Bot".
     */
    removeMentionText(activity, id) {
        const mentions = this.getMentions(activity);
        const mentionsFiltered = mentions.filter((mention) => mention.mentioned.id === id);
        if (mentionsFiltered.length) {
            activity.text = activity.text
                .replace(mentionsFiltered[0].text, '')
                .trim();
        }
        return activity.text;
    }
    /** Returns the mentions on an activity */
    getMentions(activity) {
        const result = [];
        if (activity.entities !== undefined) {
            for (let i = 0; i < activity.entities.length; i++) {
                if (activity.entities[i].type.toLowerCase() === 'mention') {
                    result.push(activity.entities[i]);
                }
            }
        }
        return result;
    }
    /** Returns the conversation reference for an activity  */
    getConversationReference(activity) {
        return {
            activityId: activity.id,
            user: shallowCopy(activity.from),
            bot: shallowCopy(activity.recipient),
            conversation: shallowCopy(activity.conversation),
            channelId: activity.channelId,
            serviceUrl: activity.serviceUrl,
            timestamp: Date.now(),
        };
    }
    /**  Updates an activity with the delivery information from a conversation reference.     */
    applyConversationReference(activity, reference, isIncoming = false) {
        activity.channelId = reference.channelId;
        activity.serviceUrl = reference.serviceUrl;
        activity.conversation = reference.conversation;
        if (isIncoming) {
            activity.from = reference.user;
            activity.recipient = reference.bot;
            if (reference.activityId) {
                activity.id = reference.activityId;
            }
        }
        else {
            activity.from = reference.bot;
            activity.recipient = reference.user;
            if (reference.activityId) {
                activity.replyToId = reference.activityId;
            }
        }
        return activity;
    }
    /** Create a ConversationReference based on an outgoing Activity's ResourceResponse  */
    getReplyConversationReference(activity, reply) {
        const reference = this.getConversationReference(activity);
        // Update the reference with the new outgoing Activity's id.
        reference.activityId = reply.id;
        return reference;
    }
    /** An asynchronous method that resumes a conversation with a user, possibly after some time has gone by. */
    async continueConversation(reference, logic) {
        const request = this.applyConversationReference({ type: ActivityTypes.Event, name: 'continueConversation' }, reference, true);
        const context = this.createContext(request);
        // always trust outbound serviceUrls
        HttpAuthAppCredentials.trustServiceUrl(reference.serviceUrl);
        try {
            await this._app.invoke(context);
            await logic(context);
        }
        catch (err) {
            if (this.onTurnError) {
                await this.onTurnError(context, err);
            }
            else {
                throw err;
            }
        }
    }
    /** An asynchronous method that creates and starts a conversation with a user on a channel.  */
    async createConversation(reference, logic) {
        if (!reference.serviceUrl) {
            throw new Error(`ActivityHelpers.createConversation(): missing serviceUrl.`);
        }
        // Create conversation
        const parameters = {
            bot: reference.bot,
            members: [reference.user],
            isGroup: false,
            activity: null,
            channelData: null,
        };
        // always trust outbound serviceUrls
        HttpAuthAppCredentials.trustServiceUrl(reference.serviceUrl);
        const client = this.createConversationsApiClient(reference.serviceUrl);
        // Mix in the tenant ID if specified. This is required for MS Teams.
        if (reference.conversation && reference.conversation.tenantId) {
            // Putting tenantId in channelData is a temporary solution while we wait for the Teams API to be updated
            parameters.channelData = {
                tenant: { id: reference.conversation.tenantId },
            };
            // Permanent solution is to put tenantId in parameters.tenantId
            parameters.tenantId = reference.conversation.tenantId;
        }
        const response = await client.conversationsCreateConversation(parameters);
        // Initialize request and copy over new conversation ID and updated serviceUrl.
        const request = this.applyConversationReference({ type: ActivityTypes.Event, name: 'createConversation' }, reference, true);
        const conversation = {
            id: response.id,
            isGroup: false,
            conversationType: null,
            tenantId: reference.conversation.tenantId,
            name: null,
        };
        request.conversation = conversation;
        request.channelData = parameters.channelData;
        if (response.serviceUrl) {
            request.serviceUrl = response.serviceUrl;
        }
        const context = this.createContext(request);
        try {
            await this._app.invoke(context);
            await logic(context);
        }
        catch (err) {
            if (this.onTurnError) {
                await this.onTurnError(context, err);
            }
            else {
                throw err;
            }
        }
    }
    async createProactiveChannelConversation(reference, activity, logic) {
        if (!reference.serviceUrl) {
            throw new Error(`ActivityHelpers.createConversation(): missing serviceUrl.`);
        }
        // Create conversation
        const conversationParameters = {
            activity,
            bot: reference.bot,
            isGroup: reference.isGroup,
            channelData: reference.channelData,
            members: reference.members,
            tenantId: reference.tenantId,
        };
        // always trust outbound serviceUrls
        HttpAuthAppCredentials.trustServiceUrl(reference.serviceUrl);
        const conversationsApiClient = this.createConversationsApiClient(reference.serviceUrl);
        const response = await conversationsApiClient.conversationsCreateConversation(conversationParameters);
        const conversationReference = {
            activityId: response.activityId,
            bot: conversationParameters.bot,
            channelId: reference.channelId,
            conversation: { id: response.id },
            serviceUrl: reference.serviceUrl,
            user: conversationParameters.bot,
        };
        // Initialize request and copy over new conversation ID and updated serviceUrl.
        const request = this.applyConversationReference({
            type: ActivityTypes.Event,
            name: 'createProactiveChannelConversation',
        }, conversationReference, false);
        request.conversation = {
            id: response.id,
            isGroup: reference.isGroup,
            conversationType: null,
            tenantId: reference.tenantId,
            name: null,
        };
        request.channelData = conversationParameters.channelData;
        if (response.serviceUrl) {
            request.serviceUrl = response.serviceUrl;
        }
        const context = this.createContext(request);
        try {
            await logic(context);
        }
        catch (err) {
            if (this.onTurnError) {
                await this.onTurnError(context, err);
            }
            else {
                throw err;
            }
        }
    }
    /** An asynchronous method that removes a member from the current conversation.  */
    async deleteConversationMember(context, memberId) {
        const { activity } = context['bot.Capability'];
        if (!activity.serviceUrl) {
            throw new Error(`ActivityHelpers.deleteConversationMember(): missing serviceUrl`);
        }
        if (!activity.conversation || !activity.conversation.id) {
            throw new Error(`ActivityHelpers.deleteConversationMember(): missing conversation or conversation.id`);
        }
        const { serviceUrl } = activity;
        const conversationId = activity.conversation.id;
        const client = this.createConversationsApiClient(serviceUrl);
        await client.conversationsDeleteConversationMember(conversationId, memberId);
    }
    /** An asynchronous method that lists the members of a given activity.  */
    async getActivityMembers(context, activityId) {
        const { activity } = context['bot.Capability'];
        if (!activityId) {
            activityId = activity.id;
        }
        if (!activity.serviceUrl) {
            throw new Error(`ActivityHelpers.getActivityMembers(): missing serviceUrl`);
        }
        if (!activity.conversation || !activity.conversation.id) {
            throw new Error(`ActivityHelpers.getActivityMembers(): missing conversation or conversation.id`);
        }
        if (!activityId) {
            throw new Error(`ActivityHelpers.getActivityMembers(): missing both activityId and context["bot.Capability"].activity.id`);
        }
        const { serviceUrl } = activity;
        const conversationId = activity.conversation.id;
        const client = this.createConversationsApiClient(serviceUrl);
        return client.conversationsGetActivityMembers(conversationId, activityId);
    }
    /** An asynchronous method that, for the specified channel, gets a page of the conversations in which this bot has participated.  */
    async getConversations(contextOrServiceUrl, continuationToken) {
        const url = typeof contextOrServiceUrl === 'object'
            ? contextOrServiceUrl['bot.Capability'].activity.serviceUrl
            : contextOrServiceUrl;
        const client = this.createConversationsApiClient(url);
        return client.conversationsGetConversations(continuationToken || undefined);
    }
}
//# sourceMappingURL=adapter-methods.js.map