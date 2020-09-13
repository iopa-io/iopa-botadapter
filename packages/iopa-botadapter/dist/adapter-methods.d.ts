import { Activity, ConversationReference, ResourceResponse, Mention, ChannelAccount, ConversationParameters, ConversationsResult } from 'iopa-botadapter-schema';
import { AdapterMethods as IAdapterMethods, IopaBotAdapterContext } from 'iopa-botadapter-types';
import { RouterApp, IopaBotContext } from 'iopa-types';
import { AdapterWithEvents } from './adapter-events';
export declare class AdapterWithEventsAndMethods extends AdapterWithEvents implements IAdapterMethods {
    constructor(app: RouterApp<{}, IopaBotContext>);
    /**
     * Rewrites the activity text without any at mention.
     * Use with caution because this function is altering the text on the Activity.
     */
    removeRecipientMention(activity: Partial<Activity>): string;
    /**
     * Remove any mention text for given id from the Activity.Text property.  For example, given the message
     * "@echoBot Hi Bot", this will remove "@echoBot", leaving "Hi Bot".
     */
    removeMentionText(activity: Partial<Activity>, id: string): string;
    /** Returns the mentions on an activity */
    getMentions(activity: Partial<Activity>): Mention[];
    /** Returns the conversation reference for an activity  */
    getConversationReference(activity: Partial<Activity>): Partial<ConversationReference & {
        timestamp: number;
    }>;
    /**  Updates an activity with the delivery information from a conversation reference.     */
    applyConversationReference(activity: Partial<Activity>, reference: Partial<ConversationReference>, isIncoming?: boolean): Partial<Activity>;
    /** Create a ConversationReference based on an outgoing Activity's ResourceResponse  */
    getReplyConversationReference(activity: Partial<Activity>, reply: ResourceResponse): Partial<ConversationReference>;
    /** An asynchronous method that resumes a conversation with a user, possibly after some time has gone by. */
    continueConversation(reference: Partial<ConversationReference>, logic: (context: IopaBotAdapterContext) => Promise<void>): Promise<void>;
    /** An asynchronous method that creates and starts a conversation with a user on a channel.  */
    createConversation(reference: Partial<ConversationReference>, logic?: (context: IopaBotAdapterContext) => Promise<void>): Promise<void>;
    createProactiveChannelConversation(reference: Partial<ConversationParameters & ConversationReference>, activity: Partial<Activity>, logic?: (context: IopaBotAdapterContext) => Promise<void>): Promise<void>;
    /** An asynchronous method that removes a member from the current conversation.  */
    deleteConversationMember(context: IopaBotAdapterContext, memberId: string): Promise<void>;
    /** An asynchronous method that lists the members of a given activity.  */
    getActivityMembers(context: IopaBotAdapterContext, activityId?: string): Promise<ChannelAccount[]>;
    /** An asynchronous method that, for the specified channel, gets a page of the conversations in which this bot has participated.  */
    getConversations(contextOrServiceUrl: IopaBotAdapterContext | string, continuationToken?: string): Promise<ConversationsResult>;
}
