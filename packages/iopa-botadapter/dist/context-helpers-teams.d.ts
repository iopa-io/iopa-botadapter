import { Activity, ConversationReference } from 'iopa-botadapter-schema';
import { ChannelInfo, TeamsChannelAccount, TeamDetails } from 'iopa-botadapter-schema-teams';
import { TeamsHelpers as ITeamsHelpers, IopaBotAdapterContext } from 'iopa-botadapter-types';
export declare class TeamsHelpers implements ITeamsHelpers {
    private _context;
    constructor(context: IopaBotAdapterContext);
    getChannelId(): string;
    getChannelName(): string;
    getTeamId(): string;
    notifyUser(outboundActivity: Activity): void;
    getTeamDetails(teamId?: string): Promise<TeamDetails>;
    getTeamChannels(teamId?: string): Promise<ChannelInfo[]>;
    getMembers(): Promise<TeamsChannelAccount[]>;
    getTeamMembers(teamId?: string): Promise<TeamsChannelAccount[]>;
    createConversation(teamsChannelId: string, message: Partial<Activity>): Promise<[ConversationReference, string]>;
    sendToGeneralChannel(message: Partial<Activity>): Promise<[ConversationReference, string]>;
    private getMembersInternal;
    private getConnectorClient;
    private getTeamsConnectorClient;
}
