import { Activity } from 'iopa-botadapter-schema'
import { ClaimsIdentity } from './claimsIdentity'
import { ICredentialProvider } from './credentialProvider'
import * as ChannelValidation from './channelValidation'
import { HttpAuthAppCredentials } from './httpAuthCredentials'
import * as EmulatorValidation from './emulatorValidation'

/**
 * Authenticates the request and sets the service url in the set of trusted urls.
 * @param  {Activity} activity The incoming Activity from the Bot Framework or the Emulator
 * @param  {string} authHeader The Bearer token included as part of the request
 * @param  {ICredentialProvider} credentials The set of valid credentials, such as the Bot Application ID
 * @returns {Promise<ClaimsIdentity>} Promise with ClaimsIdentity for the request.
 */
export async function authenticateRequest(
    activity: Activity,
    authHeader: string,
    credentials: ICredentialProvider
): Promise<ClaimsIdentity> {
    if (!authHeader || !authHeader.trim()) {
        const isAuthDisabled: boolean = await credentials.isAuthenticationDisabled()

        if (isAuthDisabled) {
            return new ClaimsIdentity([], true)
        }

        throw new Error('Unauthorized Access. Request is not authorized')
    }

    const claimsIdentity: ClaimsIdentity = await validateAuthHeader(
        authHeader,
        credentials,
        activity.channelId,
        activity.serviceUrl
    )

    HttpAuthAppCredentials.trustServiceUrl(activity.serviceUrl)

    return claimsIdentity
}

export async function validateAuthHeader(
    authHeader,
    credentials: ICredentialProvider,
    channelId: string,
    serviceUrl = ''
): Promise<ClaimsIdentity> {
    try {
        if (!authHeader.trim()) {
            throw new Error("'authHeader' required.")
        }

        const usingEmulator: boolean = EmulatorValidation.isTokenFromEmulator(
            authHeader
        )

        if (usingEmulator) {
            return await EmulatorValidation.authenticateEmulatorToken(
                authHeader,
                credentials,
                channelId
            )
        }

        if (serviceUrl.trim()) {
            return await ChannelValidation.authenticateChannelTokenWithServiceUrl(
                authHeader,
                credentials,
                serviceUrl,
                channelId
            )
        }

        return await ChannelValidation.authenticateChannelToken(
            authHeader,
            credentials,
            channelId
        )
    } catch (ex) {
        console.error(ex)
        return null
    }
}
