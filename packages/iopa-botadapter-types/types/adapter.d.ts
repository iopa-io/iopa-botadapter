import {
    Activity,
    Mention,
    ConversationReference,
    ResourceResponse,
    ConversationsApi,
} from 'iopa-botadapter-schema'

import { IopaBotAdapterContext } from './context'
import { HttpAuthAppCredentials, HttpRequest, HttpResponse } from './httpauth'
import { IopaContext, RouterApp } from 'iopa-types'
import { AdapterEvents } from './adapter-events'
import { AdapterMethods } from './adapter-methods'

/**
 * Represents a response returned by a bot when it receives an `invoke` activity.
 *
 * > [!NOTE] This interface supports the framework and is not intended to be called directly for your code.
 */
export interface InvokeResponse {
    /**
     * The HTTP status code of the response.
     */
    status: number
    /**
     * Optional. The body of the response.
     */
    body?: any
}

export interface AdapterBase {
    /**
     * Sends a set of activities to the user.
     *
     * @remarks
     * An array of responses from the server will be returned.
     * @param context Context for the current turn of conversation with the user.
     * @param activities Set of activities being sent.
     */
    sendActivities(
        context: IopaBotAdapterContext,
        activities: Partial<Activity>[]
    ): Promise<ResourceResponse[]>

    /**
     * Replaces an existing activity.
     * @param context Context for the current turn of conversation with the user.
     * @param activity New replacement activity. The activity should already have it's ID information populated.
     */
    updateActivity(activity: Partial<Activity>): Promise<void>

    /**
     * Deletes an existing activity.
     * @param context Context for the current turn of conversation with the user.
     * @param reference Conversation reference of the activity being deleted.
     */
    deleteActivity(reference: Partial<ConversationReference>): Promise<void>

    /**
     * Gets/sets a error handler that will be called anytime an uncaught exception is raised during
     * a turn.
     */
    onTurnError: (context: IopaBotAdapterContext, error: Error) => Promise<void>
}

export interface AdapterCore extends AdapterBase {
    readonly credentials: HttpAuthAppCredentials

    /**
     * An asynchronous method that creates a turn context and runs the middleware pipeline for an incoming activity.
     *
     * @param req An Express or Restify style request object.
     * @param res An Express or Restify style response object.
     * @param logic The function to call at the end of the middleware pipeline.
     *
     * @remarks
     * This is the main way a bot receives incoming messages and defines a turn in the conversation. This method:
     *
     * 1. Parses and authenticates an incoming request.
     *    - The activity is read from the body of the incoming request. An error will be returned
     *      if the activity can't be parsed.
     *    - The identity of the sender is authenticated as either the Emulator or a valid Microsoft
     *      server, using the bot's `appId` and `appPassword`. The request is rejected if the sender's
     *      identity is not verified.
     * 1. Creates a [TurnContext](xref:botbuilder-core.TurnContext) object for the received activity.
     *    - This object is wrapped with a [revocable proxy](https://www.ecma-international.org/ecma-262/6.0/#sec-proxy.revocable).
     *    - When this method completes, the proxy is revoked.
     * 1. Sends the turn context through the adapter's middleware pipeline.
     * 1. Sends the turn context to the `logic` function.
     *    - The bot may perform additional routing or processing at this time.
     *      Returning a promise (or providing an `async` handler) will cause the adapter to wait for any asynchronous operations to complete.
     *    - After the `logic` function completes, the promise chain set up by the middleware is resolved.
     *
     * Middleware can _short circuit_ a turn. When this happens, subsequent middleware and the
     * `logic` function is not called; however, all middleware prior to this point still run to completion.
     * For more information about the middleware pipeline, see the
     * [how bots work](https://docs.microsoft.com/azure/bot-service/bot-builder-basics) and
     * [middleware](https://docs.microsoft.com/azure/bot-service/bot-builder-concept-middleware) articles.
     * Use the adapter's [use](xref:botbuilder-core.BotAdapter.use) method to add middleware to the adapter.
     *
     * For example:
     * ```JavaScript
     * server.post('/api/messages', (req, res) => {
     *    // Route received request to adapter for processing
     *    adapter.processActivity(req, res, async (context) => {
     *        // Process any messages received
     *        if (context.activity.type === ActivityTypes.Message) {
     *            await context.sendActivity(`Hello World`);
     *        }
     *    });
     * });
     * ```
     *
     * > [!TIP]
     * > If you see the error `TypeError: Cannot perform 'set' on a proxy that has been revoked`
     * > in your bot's console output, the likely cause is that an async function was used
     * > without using the `await` keyword. Make sure all async functions use await!
     */
    invokeActivity(
        context: IopaContext,
        next: () => Promise<void>
    ): Promise<void>

    /**
     * An asynchronous method that sends a set of outgoing activities to a channel server.
     * > [!NOTE] This method supports the framework and is not intended to be called directly for your code.
     *
     * @param context The context object for the turn.
     * @param activities The activities to send.
     *
     * @returns An array of [ResourceResponse](xref:)
     *
     * @remarks
     * The activities will be sent one after another in the order in which they're received. A
     * response object will be returned for each sent activity. For `message` activities this will
     * contain the ID of the delivered message.
     *
     * Use the turn context's [sendActivity](xref:TurnContext.sendActivity) or
     * [sendActivities](xref:TurnContext.sendActivities) method, instead of directly
     * calling this method. The [TurnContext](xref:TurnContext) ensures that outgoing
     * activities are properly addressed and that all registered response event handlers are notified.
     */
    sendActivities(
        context: IopaBotAdapterContext,
        activities: Partial<Activity>[]
    ): Promise<ResourceResponse[]>

    /**
     * An asynchronous method that replaces a previous activity with an updated version.
     *
     * > [!NOTE]
     * > - This interface supports the framework and is not intended to be called directly for your code.
     * > - Not all channels support this operation. For channels that don't, this call may throw an exception.
     *
     * @param context The context object for the turn.
     * @param activity The updated version of the activity to replace.
     *
     * @remarks
     * Use [TurnContext.updateActivity](xref:botbuilder-core.TurnContext.updateActivity) to update
     * an activity from your bot code.
     */
    updateActivity(activity: Partial<Activity>): Promise<void>

    /**
     * An asynchronous method that deletes an existing activity.
     *
     * > [!NOTE]
     * > - This interface supports the framework and is not intended to be called directly for your code.
     * > - Not all channels support this operation. For channels that don't, this call may throw an exception.
     *
     * @param context The context object for the turn.
     * @param reference Conversation reference information for the activity to delete.
     *
     * @remarks
     * Use [TurnContext.deleteActivity](xref:botbuilder-core.TurnContext.deleteActivity) to delete
     * an activity from your bot code.
     */
    deleteActivity(reference: Partial<ConversationReference>): Promise<void>

    /**
     * Creates a connector client.
     *
     * @param serviceUrl The client's service URL.
     *
     * @remarks
     * Override this in a derived class to create a mock connector client for unit testing.
     */
    createConversationsApiClient(serviceUrl: string): ConversationsApi

    createContext(request: Partial<Activity>): IopaBotAdapterContext
}

/**
 * A [BotAdapter](xref:botbuilder-core.BotAdapter) that can connect a bot to a service endpoint.
 * Implements [IUserTokenProvider](xref:botbuilder-core.IUserTokenProvider).
 *
 * @remarks
 * The bot adapter encapsulates authentication processes and sends activities to and receives
 * activities from the Bot Connector Service. When your bot receives an activity, the adapter
 * creates a turn context object, passes it to your bot application logic, and sends responses
 * back to the user's channel.
 *
 * The adapter processes and directs incoming activities in through the bot middleware pipeline to
 * your bot logic and then back out again. As each activity flows in and out of the bot, each
 * piece of middleware can inspect or act upon the activity, both before and after the bot logic runs.
 * Use the [use](xref:botbuilder-core.BotAdapter.use) method to add [Middleware](xref:botbuilder-core.Middleware)
 * objects to your adapter's middleware collection.
 *
 * For more information, see the articles on
 * [How bots work](https://docs.microsoft.com/azure/bot-service/bot-builder-basics) and
 * [Middleware](https://docs.microsoft.com/azure/bot-service/bot-builder-concept-middleware).
 *
 * For example:
 * ```JavaScript
 * const { Adapter } = require('iopa-botadapter');
 *
 * app.use(Adapter)
 *
 * app.botadapter.onTurnError = async (context, error) => {
 *     // Catch-all logic for errors.
 * };
 * ```
 */

export interface Adapter extends AdapterCore, AdapterMethods, AdapterEvents {}
