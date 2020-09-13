import { ActivityTypes, InputHints, } from 'iopa-botadapter-schema';
import { TeamsHelpers } from './context-helpers-teams';
import { TokenHelpers } from './context-helpers-token';
const $$context = Symbol('urn:io:iopa:bot:response:context');
export class BotAdapterCapability {
    constructor(plaincontext, adapter, activity) {
        this[$$context] = plaincontext;
        this.activity = activity;
        this.adapter = adapter;
        this.teams = new TeamsHelpers(plaincontext);
        this.tokens = new TokenHelpers(plaincontext);
        this.turnState = new Map();
        this.responded = false;
    }
    /** Sends a single activity or message to the user */
    sendActivity(activityOrText, speak, inputHint) {
        let a;
        if (typeof activityOrText === 'string') {
            a = {
                text: activityOrText,
                inputHint: inputHint || InputHints.AcceptingInput,
            };
            if (speak) {
                a.speak = speak;
            }
        }
        else {
            a = activityOrText;
        }
        return this.sendActivities([a]).then((responses) => responses && responses.length > 0 ? responses[0] : undefined);
    }
    /** Sends a set of activities to the user. An array of responses from the server will be returned  */
    sendActivities(activities) {
        let sentNonTraceActivity = false;
        const ref = this.adapter.getConversationReference(this.activity);
        const output = activities.map((a) => {
            const o = this.adapter.applyConversationReference({ ...a }, ref);
            if (!o.type) {
                o.type = ActivityTypes.Message;
            }
            if (o.type !== ActivityTypes.Trace) {
                sentNonTraceActivity = true;
            }
            return o;
        });
        return this.adapter.emit('ContextSendActivities', this[$$context], { activities: output }, () => {
            return this.adapter
                .sendActivities(this[$$context], output)
                .then((responses) => {
                // Set responded flag
                if (sentNonTraceActivity) {
                    this.responded = true;
                }
                return responses;
            });
        });
    }
    /** Deletes an existing activity */
    deleteActivity(idOrReference) {
        let reference;
        if (typeof idOrReference === 'string') {
            reference = this.adapter.getConversationReference(this.activity);
            reference.activityId = idOrReference;
        }
        else {
            reference = idOrReference;
        }
        return this.adapter.emit('ContextDeleteActivity', this[$$context], { reference }, () => this.adapter.deleteActivity(reference));
    }
    /** Replaces an existing activity */
    updateActivity(activity) {
        const ref = this.adapter.getConversationReference(this.activity);
        const a = this.adapter.applyConversationReference(activity, ref);
        return this.adapter.emit('ContextUpdateActivity', this[$$context], { activity }, () => this.adapter.updateActivity(a));
    }
    /** An asynchronous method that lists the members of the current conversation.  */
    async getConversationMembers() {
        if (!this.activity.serviceUrl) {
            throw new Error(`ActivityHelpers.getConversationMembers(): missing serviceUrl`);
        }
        if (!this.activity.conversation || !this.activity.conversation.id) {
            throw new Error(`ActivityHelpers.getConversationMembers(): missing conversation or conversation.id`);
        }
        const { serviceUrl } = this.activity;
        const conversationId = this.activity.conversation.id;
        const client = this.adapter.createConversationsApiClient(serviceUrl);
        return client.conversationsGetConversationMembers(conversationId);
    }
    getConversationReference() {
        return this.adapter.getConversationReference(this.activity);
    }
    copyTo(context) {
        // TODO COPY REFERENCES ETC.
        return context;
    }
}
//# sourceMappingURL=context-capability.js.map