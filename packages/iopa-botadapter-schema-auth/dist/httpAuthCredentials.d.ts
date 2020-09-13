import { HttpAuthAppCredentials as IHttpAuthAppCredentials, HttpRequest } from 'iopa-botadapter-types';
/**
 * HttpAuthAppCredentials auth implementation and cache
 */
export declare class HttpAuthAppCredentials implements IHttpAuthAppCredentials {
    private static readonly trustedHostNames;
    private static readonly cache;
    appPassword: string;
    appId: string;
    oAuthEndpoint: string;
    oAuthScope: string;
    readonly tokenCacheKey: string;
    private refreshingToken;
    constructor(appId: string, appPassword: string, channelAuthTenant?: string);
    /**
     * Adds the host of service url to trusted hosts.
     * If expiration time is not provided, the expiration date will be current (utc) date + 1 day.
     * @param  {string} serviceUrl The service url
     * @param  {Date} expiration? The expiration date after which this service url is not trusted anymore
     */
    static trustServiceUrl(serviceUrl: string, expiration?: Date): void;
    /**
     * Checks if the service url is for a trusted host or not.
     * @param  {string} serviceUrl The service url
     * @returns {boolean} True if the host of the service url is trusted; False otherwise.
     */
    static isTrustedServiceUrl(serviceUrl: string): boolean;
    private static isTrustedUrl;
    signRequest(url: string, request: Partial<HttpRequest>): Promise<void>;
    getToken(forceRefresh?: boolean): Promise<string>;
    private refreshToken;
    private shouldSetToken;
}
