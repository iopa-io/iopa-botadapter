import {
    Activity,
    ChannelAccount,
    ConversationsApi,
    ConversationReference,
    ConversationParameters,
    ConversationResourceResponse,
} from 'iopa-botadapter-schema'

import {
    ChannelInfo,
    NotificationInfo,
    TeamInfo,
    TeamsChannelData,
    ConversationList,
    TeamsChannelAccount,
    TeamDetails,
    TeamsApi,
} from 'iopa-botadapter-schema-teams'

import {
    TeamsHelpers as ITeamsHelpers,
    IopaBotAdapterContext,
} from 'iopa-botadapter-types'

export class TeamsHelpers implements ITeamsHelpers {
    private _context: IopaBotAdapterContext

    constructor(context: IopaBotAdapterContext) {
        this._context = context
    }

    public getChannelId(): string {
        if (!this._context['bot.Capability'].activity) {
            throw new Error('Missing activity on context')
        }

        const channelData: TeamsChannelData = this._context['bot.Capability']
            .activity.channelData as TeamsChannelData
        const channel: ChannelInfo = channelData ? channelData.channel : null
        return channel && channel.id ? channel.id : null
    }

    public getChannelName(): string {
        if (!this._context['bot.Capability'].activity) {
            throw new Error('Missing activity on context')
        }

        const channelData: TeamsChannelData = this._context['bot.Capability']
            .activity.channelData as TeamsChannelData
        const channel: ChannelInfo = channelData ? channelData.channel : null
        return channel && channel.name ? channel.name : undefined
    }

    public getTeamId(): string {
        if (!this._context['bot.Capability'].activity) {
            throw new Error('Missing activity on context')
        }

        const channelData = this._context['bot.Capability'].activity
            .channelData as TeamsChannelData
        const team: TeamInfo =
            channelData && channelData.team ? channelData.team : null
        const teamId = team && typeof team.id === 'string' ? team.id : null
        return teamId
    }

    public notifyUser(outboundActivity: Activity): void {
        if (!outboundActivity) {
            throw new Error('Missing activity parameter')
        }

        if (
            !outboundActivity.channelData ||
            typeof outboundActivity.channelData !== 'object'
        ) {
            outboundActivity.channelData = {}
        }

        const channelData: TeamsChannelData = outboundActivity.channelData as TeamsChannelData
        channelData.notification = { alert: true } as NotificationInfo
    }

    //
    // Teams Info
    //

    public async getTeamDetails(teamId?: string): Promise<TeamDetails> {
        const t = teamId || this.getTeamId()
        if (!t) {
            throw new Error(
                'This method is only valid within the scope of a MS Teams Team.'
            )
        }

        return this.getTeamsConnectorClient().teamsFetchTeamDetails(t)
    }

    public async getTeamChannels(teamId?: string): Promise<ChannelInfo[]> {
        teamId = teamId || this.getTeamId()
        if (teamId) {
            throw new Error(
                'This method is only valid within the scope of a MS Teams Team.'
            )
        }

        const channelList: ConversationList = await this.getTeamsConnectorClient().teamsFetchChannelList(
            teamId
        )
        return channelList.conversations
    }

    public async getMembers(): Promise<TeamsChannelAccount[]> {
        const teamId = this.getTeamId()
        if (teamId) {
            return this.getTeamMembers(teamId)
        }
        const { conversation } = this._context['bot.Capability'].activity
        const conversationId =
            conversation && conversation.id ? conversation.id : undefined
        return this.getMembersInternal(
            this.getConnectorClient(),
            conversationId
        )
    }

    public async getTeamMembers(
        teamId?: string
    ): Promise<TeamsChannelAccount[]> {
        teamId = teamId || this.getTeamId()
        if (!teamId) {
            throw new Error(
                'This method is only valid within the scope of a MS Teams Team.'
            )
        }
        return this.getMembersInternal(this.getConnectorClient(), teamId)
    }

    public async createConversation(
        teamsChannelId: string,
        message: Partial<Activity>
    ): Promise<[ConversationReference, string]> {
        if (!teamsChannelId) {
            throw new Error('Missing valid teamsChannelId argument')
        }
        if (!message) {
            throw new Error('Missing valid message argument')
        }
        const conversationParameters = {
            isGroup: true,
            channelData: {
                channel: {
                    id: teamsChannelId,
                } as ChannelInfo,
            } as TeamsChannelData,
            activity: message,
        } as ConversationParameters
        const { adapter } = this._context['bot.Capability']
        const conversationsApiClient = adapter.createConversationsApiClient(
            this._context['bot.Capability'].activity.serviceUrl
        )

        // This call does NOT send the outbound Activity is not being sent through the middleware stack.

        const conversationResourceResponse: ConversationResourceResponse = await conversationsApiClient.conversationsCreateConversation(
            conversationParameters
        )
        const conversationReference = adapter.getConversationReference(
            this._context['bot.Capability'].activity
        ) as ConversationReference
        conversationReference.conversation.id = conversationResourceResponse.id
        return [conversationReference, conversationResourceResponse.activityId]
    }

    public sendToGeneralChannel(
        message: Partial<Activity>
    ): Promise<[ConversationReference, string]> {
        const teamId = this.getTeamId()

        if (!teamId) {
            throw new Error(
                'The current Activity was not sent from a Teams Team.'
            )
        }

        return this.createConversation(teamId, message)
    }

    private async getMembersInternal(
        connectorClient: ConversationsApi,
        conversationId: string
    ): Promise<TeamsChannelAccount[]> {
        if (!conversationId) {
            throw new Error(
                'The getMembers operation needs a valid conversationId.'
            )
        }

        const teamMembers: ChannelAccount[] = await connectorClient.conversationsGetConversationMembers(
            conversationId
        )
        teamMembers.forEach((member): void => {
            member.aadObjectId = (member as any).objectId
        })

        return teamMembers as TeamsChannelAccount[]
    }

    private getConnectorClient(): ConversationsApi {
        if (
            !this._context['bot.Capability'].adapter ||
            !(
                'createConversationsApiClient' in
                this._context['bot.Capability'].adapter
            )
        ) {
            throw new Error('This method requires a connector client.')
        }

        return this._context[
            'bot.Capability'
        ].adapter.createConversationsApiClient(
            this._context['bot.Capability'].activity.serviceUrl
        )
    }

    private getTeamsConnectorClient(): TeamsApi {
        const { credentials } = this._context['bot.Capability'].adapter

        const fetchProxy = async (url: string, init: any) => {
            await credentials.signRequest(url, init)
            return fetch(url, init)
        }

        const client = new TeamsApi(
            {},
            this._context['bot.Capability'].activity.serviceUrl.replace(
                /\/+$/,
                ''
            ),
            fetchProxy
        )

        return client
    }
}
