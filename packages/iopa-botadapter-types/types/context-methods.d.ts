import {
    Activity,
    ConversationReference,
    ResourceResponse,
    ChannelAccount,
} from 'iopa-botadapter-schema'

import {
    IopaBotAdapterContext as TurnContext,
    IopaBotAdapterContext,
} from './context'

export interface ContextMethods {
    /**
     * Sends a single activity or message to the user.
     *
     * @remarks
     * This ultimately calls [sendActivities()](#sendactivites) and is provided as a convenience to
     * make formating and sending individual activities easier.
     *
     * ```JavaScript
     * await context.botːCapability.sendActivity(`Hello World`);
     * ```
     * @param activityOrText Activity or text of a message to send the user.
     * @param speak (Optional) SSML that should be spoken to the user for the message.
     * @param inputHint (Optional) `InputHint` for the message sent to the user. Defaults to `acceptingInput`.
     */
    sendActivity(
        this: IopaBotAdapterContext,
        activityOrText: string | Partial<Activity>,
        speak?: string,
        inputHint?: string
    ): Promise<ResourceResponse | undefined>

    /**
     * Sends a set of activities to the user. An array of responses from the server will be returned.
     *
     * @remarks
     * Prior to delivery, the activities will be updated with information from the `ConversationReference`
     * for the contexts [activity](#activity) and if any activities `type` field hasn't been set it will be
     * set to a type of `message`. The array of activities will then be routed through any [onSendActivities()](#onsendactivities)
     * handlers before being passed to `adapter.sendActivities()`.
     *
     * ```JavaScript
     * await context.botːCapability.sendActivities([
     *    { type: 'typing' },
     *    { type: 'delay', value: 2000 },
     *    { type: 'message', text: 'Hello... How are you?' }
     * ]);
     * ```
     * @param activities One or more activities to send to the user.
     */
    sendActivities(
        this: IopaBotAdapterContext,
        activities: Partial<Activity>[]
    ): Promise<ResourceResponse[]>

    /** Deletes an existing activity */
    deleteActivity(
        this: IopaBotAdapterContext,
        idOrReference: string | Partial<ConversationReference>
    ): Promise<void>

    /** Replaces an existing activity */
    updateActivity(
        this: IopaBotAdapterContext,
        activity: Partial<Activity>
    ): Promise<void>

    /**
     * An asynchronous method that lists the members of the current conversation.
     *
     * @param context The context object for the turn.
     *
     * @returns An array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
     * all users currently involved in a conversation.
     *
     * @remarks
     * Returns an array of [ChannelAccount](xref:botframework-schema.ChannelAccount) objects for
     * all users currently involved in a conversation.
     *
     * This is different from [getActivityMembers](xref:botbuilder.BotFrameworkAdapter.getActivityMembers)
     * in that it will return all members of the conversation, not just those directly involved in a specific activity.
     */
    getConversationMembers(this: TurnContext): Promise<ChannelAccount[]>

    /**
     * Returns the conversation reference for this activity.
     *
     * @remarks
     * This can be saved as a plain old JSON object and then later used to message the user
     * proactively.
     *
     * ```JavaScript
     * const reference = context.getConversationReference();
     * ```
     */
    getConversationReference(): Partial<ConversationReference>
}
