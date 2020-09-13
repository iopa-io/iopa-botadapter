"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAuthHeader = exports.authenticateRequest = void 0;
const claimsIdentity_1 = require("./claimsIdentity");
const ChannelValidation = require("./channelValidation");
const httpAuthCredentials_1 = require("./httpAuthCredentials");
const EmulatorValidation = require("./emulatorValidation");
/**
 * Authenticates the request and sets the service url in the set of trusted urls.
 * @param  {Activity} activity The incoming Activity from the Bot Framework or the Emulator
 * @param  {string} authHeader The Bearer token included as part of the request
 * @param  {ICredentialProvider} credentials The set of valid credentials, such as the Bot Application ID
 * @returns {Promise<ClaimsIdentity>} Promise with ClaimsIdentity for the request.
 */
async function authenticateRequest(activity, authHeader, credentials) {
    if (!authHeader.trim()) {
        const isAuthDisabled = await credentials.isAuthenticationDisabled();
        if (isAuthDisabled) {
            return new claimsIdentity_1.ClaimsIdentity([], true);
        }
        throw new Error('Unauthorized Access. Request is not authorized');
    }
    const claimsIdentity = await validateAuthHeader(authHeader, credentials, activity.channelId, activity.serviceUrl);
    httpAuthCredentials_1.HttpAuthAppCredentials.trustServiceUrl(activity.serviceUrl);
    return claimsIdentity;
}
exports.authenticateRequest = authenticateRequest;
async function validateAuthHeader(authHeader, credentials, channelId, serviceUrl = '') {
    try {
        if (!authHeader.trim()) {
            throw new Error("'authHeader' required.");
        }
        const usingEmulator = EmulatorValidation.isTokenFromEmulator(authHeader);
        if (usingEmulator) {
            return await EmulatorValidation.authenticateEmulatorToken(authHeader, credentials, channelId);
        }
        if (serviceUrl.trim()) {
            return await ChannelValidation.authenticateChannelTokenWithServiceUrl(authHeader, credentials, serviceUrl, channelId);
        }
        return await ChannelValidation.authenticateChannelToken(authHeader, credentials, channelId);
    }
    catch (ex) {
        console.error(ex);
        return null;
    }
}
exports.validateAuthHeader = validateAuthHeader;
//# sourceMappingURL=jwtTokenValidation.js.map