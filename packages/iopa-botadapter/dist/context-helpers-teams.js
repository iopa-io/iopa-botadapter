import { TeamsApi, } from 'iopa-botadapter-schema-teams';
export class TeamsHelpers {
    constructor(context) {
        this._context = context;
    }
    getChannelId() {
        if (!this._context['bot.Capability'].activity) {
            throw new Error('Missing activity on context');
        }
        const channelData = this._context['bot.Capability']
            .activity.channelData;
        const channel = channelData ? channelData.channel : null;
        return channel && channel.id ? channel.id : null;
    }
    getChannelName() {
        if (!this._context['bot.Capability'].activity) {
            throw new Error('Missing activity on context');
        }
        const channelData = this._context['bot.Capability']
            .activity.channelData;
        const channel = channelData ? channelData.channel : null;
        return channel && channel.name ? channel.name : undefined;
    }
    getTeamId() {
        if (!this._context['bot.Capability'].activity) {
            throw new Error('Missing activity on context');
        }
        const channelData = this._context['bot.Capability'].activity
            .channelData;
        const team = channelData && channelData.team ? channelData.team : null;
        const teamId = team && typeof team.id === 'string' ? team.id : null;
        return teamId;
    }
    notifyUser(outboundActivity) {
        if (!outboundActivity) {
            throw new Error('Missing activity parameter');
        }
        if (!outboundActivity.channelData ||
            typeof outboundActivity.channelData !== 'object') {
            outboundActivity.channelData = {};
        }
        const channelData = outboundActivity.channelData;
        channelData.notification = { alert: true };
    }
    //
    // Teams Info
    //
    async getTeamDetails(teamId) {
        const t = teamId || this.getTeamId();
        if (!t) {
            throw new Error('This method is only valid within the scope of a MS Teams Team.');
        }
        return this.getTeamsConnectorClient().teamsFetchTeamDetails(t);
    }
    async getTeamChannels(teamId) {
        teamId = teamId || this.getTeamId();
        if (teamId) {
            throw new Error('This method is only valid within the scope of a MS Teams Team.');
        }
        const channelList = await this.getTeamsConnectorClient().teamsFetchChannelList(teamId);
        return channelList.conversations;
    }
    async getMembers() {
        const teamId = this.getTeamId();
        if (teamId) {
            return this.getTeamMembers(teamId);
        }
        const { conversation } = this._context['bot.Capability'].activity;
        const conversationId = conversation && conversation.id ? conversation.id : undefined;
        return this.getMembersInternal(this.getConnectorClient(), conversationId);
    }
    async getTeamMembers(teamId) {
        teamId = teamId || this.getTeamId();
        if (!teamId) {
            throw new Error('This method is only valid within the scope of a MS Teams Team.');
        }
        return this.getMembersInternal(this.getConnectorClient(), teamId);
    }
    async createConversation(teamsChannelId, message) {
        if (!teamsChannelId) {
            throw new Error('Missing valid teamsChannelId argument');
        }
        if (!message) {
            throw new Error('Missing valid message argument');
        }
        const conversationParameters = {
            isGroup: true,
            channelData: {
                channel: {
                    id: teamsChannelId,
                },
            },
            activity: message,
        };
        const { adapter } = this._context['bot.Capability'];
        const conversationsApiClient = adapter.createConversationsApiClient(this._context['bot.Capability'].activity.serviceUrl);
        // This call does NOT send the outbound Activity is not being sent through the middleware stack.
        const conversationResourceResponse = await conversationsApiClient.conversationsCreateConversation(conversationParameters);
        const conversationReference = adapter.getConversationReference(this._context['bot.Capability'].activity);
        conversationReference.conversation.id = conversationResourceResponse.id;
        return [conversationReference, conversationResourceResponse.activityId];
    }
    sendToGeneralChannel(message) {
        const teamId = this.getTeamId();
        if (!teamId) {
            throw new Error('The current Activity was not sent from a Teams Team.');
        }
        return this.createConversation(teamId, message);
    }
    async getMembersInternal(connectorClient, conversationId) {
        if (!conversationId) {
            throw new Error('The getMembers operation needs a valid conversationId.');
        }
        const teamMembers = await connectorClient.conversationsGetConversationMembers(conversationId);
        teamMembers.forEach((member) => {
            member.aadObjectId = member.objectId;
        });
        return teamMembers;
    }
    getConnectorClient() {
        if (!this._context['bot.Capability'].adapter ||
            !('createConversationsApiClient' in
                this._context['bot.Capability'].adapter)) {
            throw new Error('This method requires a connector client.');
        }
        return this._context['bot.Capability'].adapter.createConversationsApiClient(this._context['bot.Capability'].activity.serviceUrl);
    }
    getTeamsConnectorClient() {
        const { credentials } = this._context['bot.Capability'].adapter;
        const fetchProxy = async (url, init) => {
            await credentials.signRequest(url, init);
            return fetch(url, init);
        };
        const client = new TeamsApi({}, this._context['bot.Capability'].activity.serviceUrl.replace(/\/+$/, ''), fetchProxy);
        return client;
    }
}
//# sourceMappingURL=context-helpers-teams.js.map