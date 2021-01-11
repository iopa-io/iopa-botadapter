"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpAuthAppCredentials = void 0;
const url = require("url");
const AuthenticationConstants = require("./authenticationConstants");
/**
 * HttpAuthAppCredentials auth implementation and cache
 */
class HttpAuthAppCredentials {
    constructor(appId, appPassword, channelAuthTenant) {
        this.oAuthScope = AuthenticationConstants.ToChannelFromBotOAuthScope;
        this.refreshingToken = null;
        this.appId = appId;
        this.appPassword = appPassword;
        const tenant = channelAuthTenant && channelAuthTenant.length > 0
            ? channelAuthTenant
            : AuthenticationConstants.DefaultChannelAuthTenant;
        this.oAuthEndpoint =
            AuthenticationConstants.ToChannelFromBotLoginUrlPrefix +
                tenant +
                AuthenticationConstants.ToChannelFromBotTokenEndpointPath;
        this.tokenCacheKey = `${appId}-cache`;
    }
    /**
     * Adds the host of service url to trusted hosts.
     * If expiration time is not provided, the expiration date will be current (utc) date + 1 day.
     * @param  {string} serviceUrl The service url
     * @param  {Date} expiration? The expiration date after which this service url is not trusted anymore
     */
    static trustServiceUrl(serviceUrl, expiration) {
        if (!expiration) {
            expiration = new Date(Date.now() + 86400000); // 1 day
        }
        const uri = url.parse(serviceUrl);
        if (uri.host) {
            HttpAuthAppCredentials.trustedHostNames.set(uri.host, expiration);
        }
    }
    /**
     * Checks if the service url is for a trusted host or not.
     * @param  {string} serviceUrl The service url
     * @returns {boolean} True if the host of the service url is trusted; False otherwise.
     */
    static isTrustedServiceUrl(serviceUrl) {
        try {
            const uri = url.parse(serviceUrl);
            if (uri.host) {
                return HttpAuthAppCredentials.isTrustedUrl(uri.host);
            }
        }
        catch (e) {
            // tslint:disable-next-line:no-console
            console.error(e);
        }
        return false;
    }
    static isTrustedUrl(uri) {
        const expiration = HttpAuthAppCredentials.trustedHostNames.get(uri);
        if (expiration) {
            // check if the trusted service url is still valid
            return expiration.getTime() > Date.now() - 300000; // 5 Minutes
        }
        console.log(`Untrusted uri ${uri}`);
        return false;
    }
    async signRequest(url, request) {
        if (this.shouldSetToken(url)) {
            const token = await this.getToken();
            if (request.headers.set) {
                request.headers.set('authorization', `Bearer ${token}`);
            }
            else {
                ;
                request.headers.authorization = `Bearer ${token}`;
            }
        }
    }
    async getToken(forceRefresh = false) {
        if (!forceRefresh) {
            // check the global cache for the token. If we have it, and it's valid, we're done.
            const oAuthToken = HttpAuthAppCredentials.cache.get(this.tokenCacheKey);
            if (oAuthToken) {
                // we have the token. Is it valid?
                if (oAuthToken.expiration_time > Date.now()) {
                    return oAuthToken.access_token;
                }
            }
        }
        // We need to refresh the token, because:
        // 1. The user requested it via the forceRefresh parameter
        // 2. We have it, but it's expired
        // 3. We don't have it in the cache.
        const res = await this.refreshToken();
        this.refreshingToken = null;
        let oauthResponse;
        if (res && res.status === 200) {
            // `res` is equalivent to the results from the cached promise `this.refreshingToken`.
            // Because the promise has been cached, we need to see if the body has been read.
            // If the body has not been read yet, we can call res.json() to get the access_token.
            // If the body has been read, the OAuthResponse for that call should have been cached already,
            // in which case we can return the cache from there. If a cached OAuthResponse does not exist,
            // call getToken() again to retry the authentication process.
            if (!HttpAuthAppCredentials.cache.has(this.tokenCacheKey)) {
                if (res.bodyUsed) {
                    // ** not in cache but not used so likely just too close
                    // so come round again
                    return this.getToken();
                }
                oauthResponse = await res.json();
                // Subtract 5 minutes from expires_in so they'll we'll get a
                // new token before it expires.
                // eslint-disable-next-line @typescript-eslint/camelcase
                oauthResponse.expiration_time =
                    Date.now() + oauthResponse.expires_in * 1000 - 300000;
                HttpAuthAppCredentials.cache.set(this.tokenCacheKey, oauthResponse);
                return oauthResponse.access_token;
            }
            const oAuthToken = HttpAuthAppCredentials.cache.get(this.tokenCacheKey);
            if (oAuthToken) {
                return oAuthToken.access_token;
            }
            return this.getToken();
        }
        throw new Error((res && res.statusText) || 'Unknown Fetch Error Getting Token');
    }
    async refreshToken() {
        if (!this.refreshingToken) {
            const params = new url.URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', this.appId);
            params.append('client_secret', this.appPassword);
            params.append('scope', this.oAuthScope);
            this.refreshingToken = fetch(this.oAuthEndpoint, {
                method: 'POST',
                headers: [
                    [
                        'Content-Type',
                        'application/x-www-form-urlencoded; charset=UTF-8',
                    ],
                ],
                body: params,
            });
        }
        return this.refreshingToken;
    }
    shouldSetToken(url) {
        return HttpAuthAppCredentials.isTrustedServiceUrl(url);
    }
}
exports.HttpAuthAppCredentials = HttpAuthAppCredentials;
HttpAuthAppCredentials.trustedHostNames = new Map([
    ['state.botframework.com', new Date(8640000000000000)],
    ['api.botframework.com', new Date(8640000000000000)],
    ['token.botframework.com', new Date(8640000000000000)],
    ['state.botframework.azure.us', new Date(8640000000000000)],
    ['api.botframework.azure.us', new Date(8640000000000000)],
    ['token.botframework.azure.us', new Date(8640000000000000)],
    ['smba.trafficmanager.net', new Date(8640000000000000)],
]);
HttpAuthAppCredentials.cache = new Map();
//# sourceMappingURL=httpAuthCredentials.js.map