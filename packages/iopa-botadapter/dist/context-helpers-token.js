import { UserTokenApi, BotSignInApi, } from 'iopa-botadapter-schema-tokens';
const OAUTH_ENDPOINT = 'https://api.botframework.com';
export class TokenHelpers {
    constructor(context) {
        this._context = context;
    }
    /** An asynchronous method that attempts to retrieve the token for a user that's in a login flow.  */
    async getUserToken(connectionName, magicCode) {
        const { activity } = this._context['bot.Capability'];
        if (!activity.from || !activity.from.id) {
            throw new Error(`TokenHelpers.getUserToken(): missing from or from.id`);
        }
        if (!connectionName) {
            throw new Error('getUserToken() requires a connectionName but none was provided.');
        }
        const userId = activity.from.id;
        const url = this.oauthApiUrl(this._context);
        const client = this.createUserTokenApiClient(url);
        return client.userTokenGetToken(userId, connectionName, activity.channelId, magicCode);
    }
    /** An asynchronous method that signs out the user from the token server.  */
    async signOutUser(connectionName, userId) {
        const { activity } = this._context['bot.Capability'];
        if (!activity.from || !activity.from.id) {
            throw new Error(`TokenHelpers.signOutUser(): missing from or from.id`);
        }
        if (!userId) {
            userId = activity.from.id;
        }
        const url = this.oauthApiUrl(this._context);
        const client = this.createUserTokenApiClient(url);
        await client.userTokenSignOut(userId, connectionName, activity.channelId);
    }
    /** An asynchronous method that gets a sign-in link from the token server that can be sent as part */
    async getSignInLink(connectionName) {
        const { adapter, activity } = this._context['bot.Capability'];
        const conversation = adapter.getConversationReference(activity);
        const url = this.oauthApiUrl(this._context);
        const client = this.createBotSignInApiClient(url);
        const state = {
            ConnectionName: connectionName,
            Conversation: conversation,
            MsAppId: adapter.credentials.appId,
        };
        const finalState = Buffer.from(JSON.stringify(state)).toString('base64');
        return JSON.parse(await client.botSignInGetSignInUrl(finalState));
    }
    /** An asynchronous method that retrieves the token status for each configured connection for the given user.  */
    async getTokenStatus(userId, includeFilter) {
        const { activity } = this._context['bot.Capability'];
        if (!userId && (!activity.from || !activity.from.id)) {
            throw new Error(`TokenHelpers.getTokenStatus(): missing from or from.id`);
        }
        userId = userId || activity.from.id;
        const url = this.oauthApiUrl(this._context);
        const client = this.createUserTokenApiClient(url);
        return client.userTokenGetTokenStatus(userId, activity.channelId, includeFilter);
    }
    /** An asynchronous method that signs out the user from the token server. */
    async getAadTokens(connectionName, resourceUrls) {
        const { activity } = this._context['bot.Capability'];
        if (!activity.from || !activity.from.id) {
            throw new Error(`TokenHelpers.getAadTokens(): missing from or from.id`);
        }
        const userId = activity.from.id;
        const url = this.oauthApiUrl(this._context);
        const client = this.createUserTokenApiClient(url);
        return client.userTokenGetAadTokens(userId, connectionName, { resourceUrls }, activity.channelId);
    }
    /** Creates an OAuth API client. */
    createUserTokenApiClient(serviceUrl) {
        const fetchProxy = async (url, init) => {
            await this._context['bot.Capability'].adapter.credentials.signRequest(url, init);
            return fetch(url, init);
        };
        const client = new UserTokenApi({}, serviceUrl.replace(/\/+$/, ''), fetchProxy);
        return client;
    }
    /** Creates an OAuth API client. */
    createBotSignInApiClient(serviceUrl) {
        const fetchProxy = async (url, init) => {
            await this._context['bot.Capability'].adapter.credentials.signRequest(url, init);
            return fetch(url, init);
        };
        const client = new BotSignInApi({}, serviceUrl.replace(/\/+$/, ''), fetchProxy);
        return client;
    }
    /** Gets the OAuth API endpoint. */
    oauthApiUrl(contextOrServiceUrl) {
        return OAUTH_ENDPOINT;
    }
}
//# sourceMappingURL=context-helpers-token.js.map