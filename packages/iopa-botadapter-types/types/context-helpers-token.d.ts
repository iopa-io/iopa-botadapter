import { TokenResponse } from 'iopa-botadapter-schema'

import { TokenStatus } from 'iopa-botadapter-schema-tokens'

import { IopaBotAdapterContext as TurnContext } from './context'

export interface TokenHelpers {
    /**
     * An asynchronous method that attempts to retrieve the token for a user that's in a login flow.
     *
     * @param context The context object for the turn.
     * @param connectionName The name of the auth connection to use.
     * @param magicCode Optional. The validation code the user entered.
     *
     * @returns A [TokenResponse](xref:botframework-schema.TokenResponse) object that contains the user token.
     */
    getUserToken(
        connectionName: string,
        magicCode?: string
    ): Promise<TokenResponse>

    /**
     * An asynchronous method that signs out the user from the token server.
     *
     * @param context The context object for the turn.
     * @param connectionName The name of the auth connection to use.
     * @param userId The ID of user to sign out.
     */
    signOutUser(connectionName?: string, userId?: string): Promise<void>

    /**
     * An asynchronous method that gets a sign-in link from the token server that can be sent as part
     * of a [SigninCard](xref:botframework-schema.SigninCard).
     *
     * @param context The context object for the turn.
     * @param connectionName The name of the auth connection to use.
     */
    getSignInLink(connectionName: string): Promise<string>

    /**
     * An asynchronous method that retrieves the token status for each configured connection for the given user.
     *
     * @param context The context object for the turn.
     * @param userId Optional. If present, the ID of the user to retrieve the token status for.
     *      Otherwise, the ID of the user who sent the current activity is used.
     * @param includeFilter Optional. A comma-separated list of connection's to include. If present,
     *      the `includeFilter` parameter limits the tokens this method returns.
     *
     * @returns The [TokenStatus](xref:botframework-connector.TokenStatus) objects retrieved.
     */
    getTokenStatus(
        userId?: string,
        includeFilter?: string
    ): Promise<TokenStatus[]>

    /**
     * An asynchronous method that signs out the user from the token server.
     *
     * @param context The context object for the turn.
     * @param connectionName The name of the auth connection to use.
     * @param resourceUrls The list of resource URLs to retrieve tokens for.
     *
     * @returns A map of the [TokenResponse](xref:botframework-schema.TokenResponse) objects by resource URL.
     */
    getAadTokens(
        connectionName: string,
        resourceUrls: string[]
    ): Promise<{
        [propertyName: string]: TokenResponse
    }>
}
