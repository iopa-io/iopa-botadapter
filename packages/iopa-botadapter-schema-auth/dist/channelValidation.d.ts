import { VerifyOptions } from 'jsonwebtoken';
import { ClaimsIdentity } from './claimsIdentity';
import { ICredentialProvider } from './credentialProvider';
export declare let OpenIdMetadataEndpoint: string;
/**
 * TO BOT FROM CHANNEL: Token validation parameters when connecting to a bot
 */
export declare const ToBotFromChannelTokenValidationParameters: VerifyOptions;
/**
 * Validate the incoming Auth Header as a token sent from the Bot Framework Service.
 * A token issued by the Bot Framework emulator will FAIL this check.
 * @param  {string} authHeader The raw HTTP header in the format: "Bearer [longString]"
 * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
 * @param  {string} serviceUrl The ServiceUrl Claim value that must match in the identity.
 * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
 */
export declare function authenticateChannelTokenWithServiceUrl(authHeader: string, credentials: ICredentialProvider, serviceUrl: string, channelId: string): Promise<ClaimsIdentity>;
/**
 * Validate the incoming Auth Header as a token sent from the Bot Framework Service.
 * A token issued by the Bot Framework emulator will FAIL this check.
 * @param  {string} authHeader The raw HTTP header in the format: "Bearer [longString]"
 * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
 * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
 */
export declare function authenticateChannelToken(authHeader: string, credentials: ICredentialProvider, channelId: string): Promise<ClaimsIdentity>;
/**
 * Validate the ClaimsIdentity to ensure it came from the channel service.
 * @param  {ClaimsIdentity} identity The identity to validate
 * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
 * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
 */
export declare function validateIdentity(identity: ClaimsIdentity, credentials: ICredentialProvider): Promise<ClaimsIdentity>;