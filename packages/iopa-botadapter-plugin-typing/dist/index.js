import { ActivityTypes, } from 'iopa-botadapter-schema';
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
    /**
     * Create the SendTypingIndicator middleware
     * @param delay {number} Number of milliseconds to wait before sending the first typing indicator.
     * @param period {number} Number of milliseconds to wait before sending each following indicator.
     */
    constructor(delay = 500, period = 2000) {
        if (delay < 0) {
            throw new Error('Delay must be greater than or equal to zero');
        }
        if (period <= 0) {
            throw new Error('Repeat period must be greater than zero');
        }
        this.delay = delay;
        this.period = period;
    }
    /** Implement middleware signature
     * @param context {TurnContext} An incoming TurnContext object.
     * @param next {function} The next delegate function.
     */
    async invoke(_context, next) {
        const turnContext = _context['io.iopa.msbotframework.context'];
        let finished = false;
        let hTimeout;
        /**
         * @param context TurnContext object representing incoming message.
         * @param delay The initial delay before sending the first indicator.
         * @param period How often to send the indicator after the first.
         */
        function startInterval(context, delay, period) {
            hTimeout = setTimeout(async () => {
                if (!finished) {
                    let typingActivity = {
                        type: ActivityTypes.Typing,
                        relatesTo: turnContext.activity.relatesTo,
                    };
                    // Sending the Activity directly via the Adapter avoids other middleware and avoids setting the
                    // responded flag. However this also requires tha tthe conversation reference details are explicitly added.
                    const conversationReference = context['bot.Capability'].adapter.getConversationReference(turnContext.activity);
                    typingActivity = context['bot.Capability'].adapter.applyConversationReference(typingActivity, conversationReference);
                    await turnContext.adapter.sendActivities(turnContext, [
                        typingActivity,
                    ]);
                    // Pass in period as the delay to repeat at an interval.
                    startInterval(turnContext, period, period);
                }
                else {
                    // Do nothing! This turn is done and we don't want to continue sending typing indicators.
                }
            }, delay);
        }
        function stopInterval() {
            finished = true;
            if (hTimeout) {
                clearTimeout(hTimeout);
            }
        }
        if (turnContext.activity.type === ActivityTypes.Message) {
            // Set a property to track whether or not the turn is finished.
            // When it flips to true, we won't send anymore typing indicators.
            finished = false;
            startInterval(turnContext, this.delay, this.period);
        }
        // Let the rest of the process run.
        // After everything has run, stop the indicator!
        return next().then(stopInterval, stopInterval);
    }
}
//# sourceMappingURL=index.js.map