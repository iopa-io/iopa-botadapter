"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateIdentity = exports.authenticateChannelToken = exports.authenticateChannelTokenWithServiceUrl = exports.ToBotFromChannelTokenValidationParameters = exports.OpenIdMetadataEndpoint = void 0;
const AuthenticationConstants = require("./authenticationConstants");
const jwtTokenExtractor_1 = require("./jwtTokenExtractor");
/**
 * TO BOT FROM CHANNEL: Token validation parameters when connecting to a bot
 */
exports.ToBotFromChannelTokenValidationParameters = {
    issuer: [AuthenticationConstants.ToBotFromChannelTokenIssuer],
    audience: undefined,
    clockTolerance: 5 * 60,
    ignoreExpiration: false,
};
/**
 * Validate the incoming Auth Header as a token sent from the Bot Framework Service.
 * A token issued by the Bot Framework emulator will FAIL this check.
 * @param  {string} authHeader The raw HTTP header in the format: "Bearer [longString]"
 * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
 * @param  {string} serviceUrl The ServiceUrl Claim value that must match in the identity.
 * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
 */
async function authenticateChannelTokenWithServiceUrl(authHeader, credentials, serviceUrl, channelId) {
    const identity = await authenticateChannelToken(authHeader, credentials, channelId);
    const serviceUrlClaim = identity.getClaimValue(AuthenticationConstants.ServiceUrlClaim);
    if (serviceUrlClaim !== serviceUrl) {
        // Claim must match. Not Authorized.
        throw new Error('Unauthorized. ServiceUrl claim do not match.');
    }
    return identity;
}
exports.authenticateChannelTokenWithServiceUrl = authenticateChannelTokenWithServiceUrl;
/**
 * Validate the incoming Auth Header as a token sent from the Bot Framework Service.
 * A token issued by the Bot Framework emulator will FAIL this check.
 * @param  {string} authHeader The raw HTTP header in the format: "Bearer [longString]"
 * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
 * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
 */
async function authenticateChannelToken(authHeader, credentials, channelId) {
    const tokenExtractor = new jwtTokenExtractor_1.JwtTokenExtractor(exports.ToBotFromChannelTokenValidationParameters, exports.OpenIdMetadataEndpoint
        ? exports.OpenIdMetadataEndpoint
        : AuthenticationConstants.ToBotFromChannelOpenIdMetadataUrl, AuthenticationConstants.AllowedSigningAlgorithms);
    const identity = await tokenExtractor.getIdentityFromAuthHeader(authHeader, channelId);
    return await validateIdentity(identity, credentials);
}
exports.authenticateChannelToken = authenticateChannelToken;
/**
 * Validate the ClaimsIdentity to ensure it came from the channel service.
 * @param  {ClaimsIdentity} identity The identity to validate
 * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
 * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
 */
async function validateIdentity(identity, credentials) {
    if (!identity || !identity.isAuthenticated) {
        // The token is in some way invalid. Not Authorized.
        throw new Error('Unauthorized. Is not authenticated');
    }
    // Now check that the AppID in the claimset matches
    // what we're looking for. Note that in a multi-tenant bot, this value
    // comes from developer code that may be reaching out to a service, hence the
    // Async validation.
    // Look for the "aud" claim, but only if issued from the Bot Framework
    if (identity.getClaimValue(AuthenticationConstants.IssuerClaim) !==
        AuthenticationConstants.ToBotFromChannelTokenIssuer) {
        // The relevant Audiance Claim MUST be present. Not Authorized.
        throw new Error('Unauthorized. Issuer Claim MUST be present.');
    }
    // The AppId from the claim in the token must match the AppId specified by the developer.
    // In this case, the token is destined for the app, so we find the app ID in the audience claim.
    const audClaim = identity.getClaimValue(AuthenticationConstants.AudienceClaim);
    if (!(await credentials.isValidAppId(audClaim || ''))) {
        // The AppId is not valid or not present. Not Authorized.
        throw new Error(`Unauthorized. Invalid AppId passed on token: ${audClaim}`);
    }
    return identity;
}
exports.validateIdentity = validateIdentity;
//# sourceMappingURL=channelValidation.js.map