import { IopaBotAdapterContext } from 'iopa-botadapter-types';
/**
 * Middleware that will send a typing indicator autmatically for each message.
 *
 * @remarks
 * When added, this middleware will send typing activities back to the user when a Message activity
 * is receieved to let them know that the bot has received the message and is working on the response.
 * You can specify a delay in milliseconds before the first typing activity is sent and then a frequency,
 * also in milliseconds which determines how often another typing activity is sent. Typing activities
 * will continue to be sent until your bot sends another message back to the user
 */
export default class ShowTypingMiddleware {
    private readonly delay;
    private readonly period;
    /**
     * Create the SendTypingIndicator middleware
     * @param delay {number} Number of milliseconds to wait before sending the first typing indicator.
     * @param period {number} Number of milliseconds to wait before sending each following indicator.
     */
    constructor(delay?: number, period?: number);
    /** Implement middleware signature
     * @param context {TurnContext} An incoming TurnContext object.
     * @param next {function} The next delegate function.
     */
    invoke(_context: IopaBotAdapterContext, next: () => Promise<void>): Promise<void>;
}