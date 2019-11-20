import { ConversationReference, TokenResponse } from 'iopa-botadapter-schema'

import {
    TokenStatus,
    UserTokenApi,
    BotSignInApi,
} from 'iopa-botadapter-schema-tokens'

const OAUTH_ENDPOINT = 'https://api.botframework.com'

import {
    TokenHelpers as ITokenHelpers,
    IopaBotAdapterContext,
} from 'iopa-botadapter-types'

export class TokenHelpers implements ITokenHelpers {
    private context: IopaBotAdapterContext

    constructor(context: IopaBotAdapterContext) {
        this.context = context
    }

    /** An asynchronous method that attempts to retrieve the token for a user that's in a login flow.  */
    public async getUserToken(
        connectionName: string,
        magicCode?: string
    ): Promise<TokenResponse> {
        const activity = this.context.botːCapability.activity

        if (!activity.from || !activity.from.id) {
            throw new Error(
                `TokenHelpers.getUserToken(): missing from or from.id`
            )
        }
        if (!connectionName) {
            throw new Error(
                'getUserToken() requires a connectionName but none was provided.'
            )
        }
        const userId: string = activity.from.id
        const url: string = this.oauthApiUrl(this.context)
        const client: UserTokenApi = this.createUserTokenApiClient(url)

        return await client.userTokenGetToken(
            userId,
            connectionName,
            activity.channelId,
            magicCode
        )
    }

    /** An asynchronous method that signs out the user from the token server.  */
    public async signOutUser(
        connectionName?: string,
        userId?: string
    ): Promise<void> {
        const activity = this.context.botːCapability.activity

        if (!activity.from || !activity.from.id) {
            throw new Error(
                `TokenHelpers.signOutUser(): missing from or from.id`
            )
        }
        if (!userId) {
            userId = activity.from.id
        }

        const url: string = this.oauthApiUrl(this.context)
        const client: UserTokenApi = this.createUserTokenApiClient(url)
        await client.userTokenSignOut(
            userId,
            connectionName,
            activity.channelId
        )
    }

    /** An asynchronous method that gets a sign-in link from the token server that can be sent as part */
    public async getSignInLink(connectionName: string): Promise<string> {
        const { adapter, activity } = this.context.botːCapability

        const conversation: Partial<ConversationReference> = adapter.getConversationReference(
            activity
        )
        const url: string = this.oauthApiUrl(this.context)
        const client: BotSignInApi = this.createBotSignInApiClient(url)
        const state: any = {
            ConnectionName: connectionName,
            Conversation: conversation,
            MsAppId: adapter.credentials.appId,
        }

        const finalState: string = Buffer.from(JSON.stringify(state)).toString(
            'base64'
        )
        return JSON.parse(await client.botSignInGetSignInUrl(finalState))
    }

    /** An asynchronous method that retrieves the token status for each configured connection for the given user.  */
    public async getTokenStatus(
        userId?: string,
        includeFilter?: string
    ): Promise<TokenStatus[]> {
        const activity = this.context.botːCapability.activity

        if (!userId && (!activity.from || !activity.from.id)) {
            throw new Error(
                `TokenHelpers.getTokenStatus(): missing from or from.id`
            )
        }
        userId = userId || activity.from.id
        const url: string = this.oauthApiUrl(this.context)
        const client: UserTokenApi = this.createUserTokenApiClient(url)

        return await client.userTokenGetTokenStatus(
            userId,
            activity.channelId,
            includeFilter
        )
    }

    /** An asynchronous method that signs out the user from the token server. */
    public async getAadTokens(
        connectionName: string,
        resourceUrls: string[]
    ): Promise<{
        [propertyName: string]: TokenResponse
    }> {
        const activity = this.context.botːCapability.activity

        if (!activity.from || !activity.from.id) {
            throw new Error(
                `TokenHelpers.getAadTokens(): missing from or from.id`
            )
        }
        const userId: string = activity.from.id
        const url: string = this.oauthApiUrl(this.context)
        const client: UserTokenApi = this.createUserTokenApiClient(url)

        return await client.userTokenGetAadTokens(
            userId,
            connectionName,
            { resourceUrls: resourceUrls },
            activity.channelId
        )
    }

    /** Creates an OAuth API client. */
    protected createUserTokenApiClient(serviceUrl: string): UserTokenApi {
        const fetchProxy = async (url: string, init: any) => {
            await this.context.botːCapability.adapter.credentials.signRequest(
                url,
                init
            )
            return fetch(url, init)
        }

        const client = new UserTokenApi(
            {},
            serviceUrl.replace(/\/+$/, ''),
            fetchProxy
        )

        return client
    }

    /** Creates an OAuth API client. */
    protected createBotSignInApiClient(serviceUrl: string): BotSignInApi {
        const fetchProxy = async (url: string, init: any) => {
            await this.context.botːCapability.adapter.credentials.signRequest(
                url,
                init
            )
            return fetch(url, init)
        }

        const client = new BotSignInApi(
            {},
            serviceUrl.replace(/\/+$/, ''),
            fetchProxy
        )

        return client
    }

    /** Gets the OAuth API endpoint.*/
    protected oauthApiUrl(
        contextOrServiceUrl: IopaBotAdapterContext | string
    ): string {
        return OAUTH_ENDPOINT
    }
}
