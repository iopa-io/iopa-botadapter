import { Activity, ConversationReference, ResourceResponse, InputHints, ChannelAccount } from 'iopa-botadapter-schema';
import { ContextMethods as IContextMethods, TeamsHelpers as ITeamsHelpers, TokenHelpers as ITokenHelpers, IBotAdapterCapability, Adapter, IopaBotAdapterContext } from 'iopa-botadapter-types';
import { IopaContext } from 'iopa-types';
declare const $$context: unique symbol;
export declare class BotAdapterCapability implements IBotAdapterCapability, IContextMethods {
    private readonly [$$context];
    readonly adapter: Adapter;
    readonly activity: Activity;
    readonly teams: ITeamsHelpers;
    readonly tokens: ITokenHelpers;
    readonly turnState: Map<any, any>;
    responded: boolean;
    constructor(plaincontext: IopaContext, adapter: Adapter, activity: Activity);
    /** Sends a single activity or message to the user */
    sendActivity(activityOrText: string | Partial<Activity>, speak?: string, inputHint?: string | InputHints): Promise<ResourceResponse | undefined>;
    /** Sends a set of activities to the user. An array of responses from the server will be returned  */
    sendActivities(activities: Partial<Activity>[]): Promise<ResourceResponse[]>;
    /** Deletes an existing activity */
    deleteActivity(idOrReference: string | Partial<ConversationReference>): Promise<void>;
    /** Replaces an existing activity */
    updateActivity(activity: Partial<Activity>): Promise<void>;
    /** An asynchronous method that lists the members of the current conversation.  */
    getConversationMembers(): Promise<ChannelAccount[]>;
    getConversationReference(): Partial<ConversationReference>;
    copyTo(this: IopaBotAdapterContext, context: IopaBotAdapterContext): IopaBotAdapterContext;
}
export {};
