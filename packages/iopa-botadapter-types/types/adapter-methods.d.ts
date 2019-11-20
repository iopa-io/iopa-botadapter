import {
    Activity,
    Mention,
    ConversationReference,
    ResourceResponse,
    ChannelAccount,
    ConversationsResult,
    InputHints,
    ConversationParameters,
} from 'iopa-botadapter-schema'

import {
    IopaBotAdapterContext as TurnContext,
    IopaBotAdapterContext,
} from './context'

export interface AdapterMethods {
    /* Rewrites the activity text without any at mention.
     * Use with caution because this function is altering the text on the Activity.
     *
     * @remarks
     * Some channels, for example Microsoft Teams, add at mention details into the text on a message activity.
     * This can interfere with later processing. This is a helper function to remove the at mention.
     *
     * ```JavaScript
     * const updatedText = TurnContext.removeRecipientMention(context.request);
     * ```
     * @param activity The activity to alter the text on
     */
    removeRecipientMention(activity: Partial<Activity>): string

    /**
     * Remove any mention text for given id from the Activity.Text property.  For example, given the message
     * "@echoBot Hi Bot", this will remove "@echoBot", leaving "Hi Bot".
     *
     * Typically this would be used to remove the mention text for the target recipient (the bot usually), though
     * it could be called for each member.  For example:
     *   turnContext.Activity.RemoveMentionText(turnContext.Activity.Recipient.Id);
     *
     * The format of a mention Activity.Entity is dependent on the Channel.  But in all cases we
     * expect the Mention.Text to contain the exact text for the user as it appears in
     * Activity.Text.
     *
     * For example, Teams uses "<at>username</at>", whereas slack use "@username". It
     * is expected that text is in Activity.Text and this method will remove that value from
     * Activity.Text.
     *
     * ```JavaScript
     * const updatedText = TurnContext.removeRecipientMention(context.request);
     * ```
     * @param activity The activity to alter the text on
     * @param id The recipient id of the at mention
     */
    removeMentionText(activity: Partial<Activity>, id: string): string

    /**
     * Returns the mentions on an activity.
     *
     * ```JavaScript
     * const mentions = TurnContext.getMentions(context.request);
     * ```
     * @param activity The activity to alter the text on
     * @param id The recipient id of the at mention
     */
    getMentions(activity: Partial<Activity>): Mention[]

    /**
     * Returns the conversation reference for an activity.
     *
     * @remarks
     * This can be saved as a plain old JSON object and then later used to message the user
     * proactively.
     *
     * ```JavaScript
     * const reference = TurnContext.getConversationReference(context.request);
     * ```
     * @param activity The activity to copy the conversation reference from
     */
    getConversationReference(
        activity: Partial<Activity>
    ): Partial<ConversationReference & { timestamp: number }>

    /**
     * Updates an activity with the delivery information from a conversation reference.
     *
     * @remarks
     * Calling this after [getConversationReference()](#getconversationreference) on an incoming
     * activity will properly address the reply to a received activity.
     *
     * ```JavaScript
     * // Send a typing indicator without going through a middleware listeners.
     * const reference = TurnContext.getConversationReference(context.activity);
     * const activity = TurnContext.applyConversationReference({ type: 'typing' }, reference);
     * await context.adapter.sendActivities([activity]);
     * ```
     * @param activity Activity to copy delivery information to.
     * @param reference Conversation reference containing delivery information.
     * @param isIncoming (Optional) flag indicating whether the activity is an incoming or outgoing activity. Defaults to `false` indicating the activity is outgoing.
     */
    applyConversationReference(
        activity: Partial<Activity>,
        reference: Partial<ConversationReference>,
        isIncoming?: boolean
    ): Partial<Activity>

    /**
     * Create a ConversationReference based on an outgoing Activity's ResourceResponse
     *
     * @remarks
     * This method can be used to create a ConversationReference that can be stored
     * and used later to delete or update the activity.
     * ```javascript
     * var reply = await context.sendActivity('Hi');
     * var reference = TurnContext.getReplyConversationReference(context.activity, reply);
     * ```
     *
     * @param activity Activity from which to pull Conversation info
     * @param reply ResourceResponse returned from sendActivity
     */
    getReplyConversationReference(
        activity: Partial<Activity>,
        reply: ResourceResponse
    ): Partial<ConversationReference>

    /**
     * An asynchronous method that resumes a conversation with a user, possibly after some time has gone by.
     *
     * @param reference A reference to the conversation to continue.
     * @param logic The asynchronous method to call after the adapter middleware runs.
     *
     * @remarks
     * This is often referred to as a _proactive notification_, the bot can proactively
     * send a message to a conversation or user without waiting for an incoming message.
     * For example, a bot can use this method to send notifications or coupons to a user.
     *
     * To send a proactive message:
     * 1. Save a copy of a [ConversationReference](xref:botframework-schema.ConversationReference)
     *    from an incoming activity. For example, you can store the conversation reference in a database.
     * 1. Call this method to resume the conversation at a later time. Use the saved reference to access the conversation.
     * 1. On success, the adapter generates a [TurnContext](xref:botbuilder-core.TurnContext) object and calls the `logic` function handler.
     *    Use the `logic` function to send the proactive message.
     *
     * To copy the reference from any incoming activity in the conversation, use the
     * [TurnContext.getConversationReference](xref:botbuilder-core.TurnContext.getConversationReference) method.
     *
     * This method is similar to the [processActivity](xref:botbuilder.BotFrameworkAdapter.processActivity) method.
     * The adapter creates a [TurnContext](xref:botbuilder-core.TurnContext) and routes it through
     * its middleware before calling the `logic` handler. The created activity will have a
     * [type](xref:botframework-schema.Activity.type) of 'event' and a
     * [name](xref:botframework-schema.Activity.name) of 'continueConversation'.
     *
     * For example:
     * ```JavaScript
     * server.post('/api/notifyUser', async (req, res) => {
     *    // Lookup previously saved conversation reference.
     *    const reference = await findReference(req.body.refId);
     *
     *    // Proactively notify the user.
     *    if (reference) {
     *       await adapter.continueConversation(reference, async (context) => {
     *          await context.sendActivity(req.body.message);
     *       });
     *       res.send(200);
     *    } else {
     *       res.send(404);
     *    }
     * });
     * ```
     */
    continueConversation(
        reference: Partial<ConversationReference>,
        logic: (context: TurnContext) => Promise<void>
    ): Promise<void>

    /**
     * An asynchronous method that creates and starts a conversation with a user on a channel.
     *
     * @param reference A reference for the conversation to create.
     * @param logic The asynchronous method to call after the adapter middleware runs.
     *
     * @remarks
     * To use this method, you need both the bot's and the user's account information on a channel.
     * The Bot Connector service supports the creating of group conversations; however, this
     * method and most channels only support initiating a direct message (non-group) conversation.
     *
     * To create and start a new conversation:
     * 1. Get a copy of a [ConversationReference](xref:botframework-schema.ConversationReference) from an incoming activity.
     * 1. Set the [user](xref:botframework-schema.ConversationReference.user) property to the
     *    [ChannelAccount](xref:botframework-schema.ChannelAccount) value for the intended recipient.
     * 1. Call this method to request that the channel create a new conversation with the specified user.
     * 1. On success, the adapter generates a turn context and calls the `logic` function handler.
     *
     * To get the initial reference, use the
     * [TurnContext.getConversationReference](xref:botbuilder-core.TurnContext.getConversationReference)
     * method on any incoming activity in the conversation.
     *
     * If the channel establishes the conversation, the generated event activity's
     * [conversation](xref:botframework-schema.Activity.conversation) property will contain the
     * ID of the new conversation.
     *
     * This method is similar to the [processActivity](xref:botbuilder.BotFrameworkAdapter.processActivity) method.
     * The adapter creates a [TurnContext](xref:botbuilder-core.TurnContext) and routes it through
     * middleware before calling the `logic` handler. The created activity will have a
     * [type](xref:botframework-schema.Activity.type) of 'event' and a
     * [name](xref:botframework-schema.Activity.name) of 'createConversation'.
     *
     * For example:
     * ```JavaScript
     * // Get group members conversation reference
     * const reference = TurnContext.getConversationReference(context.activity);
     *
     * // ...
     * // Start a new conversation with the user
     * await adapter.createConversation(reference, async (ctx) => {
     *    await ctx.sendActivity(`Hi (in private)`);
     * });
     * ```
     */
    createConversation(
        reference: Partial<ConversationReference>,
        logic?: (context: TurnContext) => Promise<void>
    ): Promise<void>

    createProactiveChannelConversation(
        reference: Partial<ConversationReference>,
        activity: Partial<Activity>,
        logic?: (context: IopaBotAdapterContext) => Promise<void>
    ): Promise<void>

    /**
     * An asynchronous method that removes a member from the current conversation.
     *
     * > [!NOTE] Not all channels support this operation. For channels that don't, this call may throw an exception.
     *
     * @param context The context object for the turn.
     * @param memberId The ID of the member to remove from the conversation.
     *
     * @remarks
     * Remove a member's identity information from the conversation.
     */
    deleteConversationMember(
        context: TurnContext,
        memberId: string
    ): Promise<void>

    /**
     * An asynchronous method that lists the members of a given activity.
     *
     * @param context The context object for the turn.
     * @param activityId Optional. The ID of the activity to get the members of. If not specified, the current activity ID is used.
     *
     * @returns An array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
     * the users involved in a given activity.
     *
     * @remarks
     * Returns an array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
     * the users involved in a given activity.
     *
     * This is different from [getConversationMembers](xref:botbuilder.BotFrameworkAdapter.getConversationMembers)
     * in that it will return only those users directly involved in the activity, not all members of the conversation.
     */
    getActivityMembers(
        context: TurnContext,
        activityId?: string
    ): Promise<ChannelAccount[]>

    /**
     * An asynchronous method that, for the specified channel, gets a page of the conversations in which this bot has participated.
     *
     * @param contextOrServiceUrl The URL of the channel server to query or a
     * [TurnContext](xref:botbuilder-core.TurnContext) object from a conversation on the channel.
     * @param continuationToken Optional. The continuation token from the previous page of results.
     * Omit this parameter or use `undefined` to retrieve the first page of results.
     *
     * @returns A [ConversationsResult](xref:botframework-schema.ConversationsResult) object containing a page of results
     * and a continuation token.
     *
     * @remarks
     * The the return value's [conversations](xref:botframework-schema.ConversationsResult.conversations) property contains a page of
     * [ConversationMembers](xref:botframework-schema.ConversationMembers) objects. Each object's
     * [id](xref:botframework-schema.ConversationMembers.id) is the ID of a conversation in which the bot has participated on this channel.
     * This method can be called from outside the context of a conversation, as only the bot's service URL and credentials are required.
     *
     * The channel batches results in pages. If the result's
     * [continuationToken](xref:botframework-schema.ConversationsResult.continuationToken) property is not empty, then
     * there are more pages to get. Use the returned token to get the next page of results.
     * If the `contextOrServiceUrl` parameter is a [TurnContext](xref:botbuilder-core.TurnContext), the URL of the channel server is
     * retrieved from
     * `contextOrServiceUrl`.[activity](xref:botbuilder-core.TurnContext.activity).[serviceUrl](xref:botframework-schema.Activity.serviceUrl).
     */
    getConversations(
        contextOrServiceUrl: TurnContext | string,
        continuationToken?: string
    ): Promise<ConversationsResult>
}
