import { TokenResponse } from 'iopa-botadapter-schema';
import { TokenStatus, UserTokenApi, BotSignInApi } from 'iopa-botadapter-schema-tokens';
import { TokenHelpers as ITokenHelpers, IopaBotAdapterContext } from 'iopa-botadapter-types';
export declare class TokenHelpers implements ITokenHelpers {
    private context;
    constructor(context: IopaBotAdapterContext);
    /** An asynchronous method that attempts to retrieve the token for a user that's in a login flow.  */
    getUserToken(connectionName: string, magicCode?: string): Promise<TokenResponse>;
    /** An asynchronous method that signs out the user from the token server.  */
    signOutUser(connectionName?: string, userId?: string): Promise<void>;
    /** An asynchronous method that gets a sign-in link from the token server that can be sent as part */
    getSignInLink(connectionName: string): Promise<string>;
    /** An asynchronous method that retrieves the token status for each configured connection for the given user.  */
    getTokenStatus(userId?: string, includeFilter?: string): Promise<TokenStatus[]>;
    /** An asynchronous method that signs out the user from the token server. */
    getAadTokens(connectionName: string, resourceUrls: string[]): Promise<{
        [propertyName: string]: TokenResponse;
    }>;
    /** Creates an OAuth API client. */
    protected createUserTokenApiClient(serviceUrl: string): UserTokenApi;
    /** Creates an OAuth API client. */
    protected createBotSignInApiClient(serviceUrl: string): BotSignInApi;
    /** Gets the OAuth API endpoint.*/
    protected oauthApiUrl(contextOrServiceUrl: IopaBotAdapterContext | string): string;
}
