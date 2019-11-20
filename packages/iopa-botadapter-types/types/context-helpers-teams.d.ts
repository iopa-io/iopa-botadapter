import { Activity, ConversationReference } from 'iopa-botadapter-schema'

import {
    TeamDetails,
    ChannelInfo,
    TeamsChannelAccount,
} from 'iopa-botadapter-schema-teams'

import { IopaBotAdapterContext } from './context'

export interface TeamsHelpers {
    getChannelName(): string

    getChannelId(): string

    getTeamId(): string

    getTeamDetails(teamId?: string): Promise<TeamDetails>

    getTeamChannels(teamId?: string): Promise<ChannelInfo[]>

    getMembers(): Promise<TeamsChannelAccount[]>

    getTeamMembers(teamId?: string): Promise<TeamsChannelAccount[]>

    createConversation(
        teamsChannelId: string,
        message: Partial<Activity>
    ): Promise<[ConversationReference, string]>

    sendToGeneralChannel(
        message: Partial<Activity>
    ): Promise<[ConversationReference, string]>
}
