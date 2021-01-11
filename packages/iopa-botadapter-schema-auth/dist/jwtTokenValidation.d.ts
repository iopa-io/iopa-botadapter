import { Activity } from 'iopa-botadapter-schema';
import { ClaimsIdentity } from './claimsIdentity';
import { ICredentialProvider } from './credentialProvider';
/**
 * Authenticates the request and sets the service url in the set of trusted urls.
 * @param  {Activity} activity The incoming Activity from the Bot Framework or the Emulator
 * @param  {string} authHeader The Bearer token included as part of the request
 * @param  {ICredentialProvider} credentials The set of valid credentials, such as the Bot Application ID
 * @returns {Promise<ClaimsIdentity>} Promise with ClaimsIdentity for the request.
 */
export declare function authenticateRequest(activity: Activity, authHeader: string, credentials: ICredentialProvider): Promise<ClaimsIdentity>;
export declare function validateAuthHeader(authHeader: any, credentials: ICredentialProvider, channelId: string, serviceUrl?: string): Promise<ClaimsIdentity>;
