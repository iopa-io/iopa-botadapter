"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateEmulatorToken = exports.isTokenFromEmulator = exports.ToBotFromEmulatorTokenValidationParameters = void 0;
/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const jwt = require("jsonwebtoken");
const AuthenticationConstants = require("./authenticationConstants");
const jwtTokenExtractor_1 = require("./jwtTokenExtractor");
/**
 * Validates and Examines JWT tokens from the Bot Framework Emulator
 */
/**
 * TO BOT FROM EMULATOR: Token validation parameters when connecting to a channel.
 */
exports.ToBotFromEmulatorTokenValidationParameters = {
    issuer: [
        'https://sts.windows.net/d6d49420-f39b-4df7-a1dc-d59a935871db/',
        'https://login.microsoftonline.com/d6d49420-f39b-4df7-a1dc-d59a935871db/v2.0',
        'https://sts.windows.net/f8cdef31-a31e-4b4a-93e4-5f571e91255a/',
        'https://login.microsoftonline.com/f8cdef31-a31e-4b4a-93e4-5f571e91255a/v2.0',
        'https://sts.windows.net/72f988bf-86f1-41af-91ab-2d7cd011db47/',
        'https://sts.windows.net/cab8a31a-1906-4287-a0d8-4eef66b95f6e/',
        'https://login.microsoftonline.us/cab8a31a-1906-4287-a0d8-4eef66b95f6e/v2.0',
    ],
    audience: undefined,
    clockTolerance: 5 * 60,
    ignoreExpiration: false,
};
/**
 * Determines if a given Auth header is from the Bot Framework Emulator
 * @param  {string} authHeader Bearer Token, in the "Bearer [Long String]" Format.
 * @returns {boolean} True, if the token was issued by the Emulator. Otherwise, false.
 */
function isTokenFromEmulator(authHeader) {
    // The Auth Header generally looks like this:
    // "Bearer eyJ0e[...Big Long String...]XAiO"
    if (!authHeader) {
        // No token. Can't be an emulator token.
        return false;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        // Emulator tokens MUST have exactly 2 parts. If we don't have 2 parts, it's not an emulator token
        return false;
    }
    const authScheme = parts[0];
    const bearerToken = parts[1];
    // We now have an array that should be:
    // [0] = "Bearer"
    // [1] = "[Big Long String]"
    if (authScheme !== 'Bearer') {
        // The scheme from the emulator MUST be "Bearer"
        return false;
    }
    // Parse the Big Long String into an actual token.
    const token = jwt.decode(bearerToken, { complete: true });
    if (!token) {
        return false;
    }
    // Is there an Issuer?
    const issuer = token.payload.iss;
    if (!issuer) {
        // No Issuer, means it's not from the Emulator.
        return false;
    }
    // Is the token issues by a source we consider to be the emulator?
    if (exports.ToBotFromEmulatorTokenValidationParameters.issuer &&
        exports.ToBotFromEmulatorTokenValidationParameters.issuer.indexOf(issuer) === -1) {
        // Not a Valid Issuer. This is NOT a Bot Framework Emulator Token.
        return false;
    }
    // The Token is from the Bot Framework Emulator. Success!
    return true;
}
exports.isTokenFromEmulator = isTokenFromEmulator;
/**
 * Validate the incoming Auth Header as a token sent from the Bot Framework Emulator.
 * A token issued by the Bot Framework will FAIL this check. Only Emulator tokens will pass.
 * @param  {string} authHeader The raw HTTP header in the format: "Bearer [longString]"
 * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
 * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
 */
async function authenticateEmulatorToken(authHeader, credentials, channelId) {
    try {
        const openIdMetadataUrl = AuthenticationConstants.ToBotFromEmulatorOpenIdMetadataUrl;
        const tokenExtractor = new jwtTokenExtractor_1.JwtTokenExtractor(exports.ToBotFromEmulatorTokenValidationParameters, openIdMetadataUrl, AuthenticationConstants.AllowedSigningAlgorithms);
        const identity = await tokenExtractor.getIdentityFromAuthHeader(authHeader, channelId);
        if (!identity) {
            // No valid identity. Not Authorized.
            throw new Error('Unauthorized. No valid identity.');
        }
        if (!identity.isAuthenticated) {
            // The token is in some way invalid. Not Authorized.
            throw new Error('Unauthorized. Is not authenticated');
        }
        // Now check that the AppID in the claimset matches
        // what we're looking for. Note that in a multi-tenant bot, this value
        // comes from developer code that may be reaching out to a service, hence the
        // Async validation.
        const versionClaim = identity.getClaimValue(AuthenticationConstants.VersionClaim);
        if (versionClaim === null) {
            throw new Error('Unauthorized. "ver" claim is required on Emulator Tokens.');
        }
        let appId = '';
        // The Emulator, depending on Version, sends the AppId via either the
        // appid claim (Version 1) or the Authorized Party claim (Version 2).
        if (!versionClaim || versionClaim === '1.0') {
            // either no Version or a version of "1.0" means we should look for
            // the claim in the "appid" claim.
            const appIdClaim = identity.getClaimValue(AuthenticationConstants.AppIdClaim);
            if (!appIdClaim) {
                // No claim around AppID. Not Authorized.
                throw new Error('Unauthorized. "appid" claim is required on Emulator Token version "1.0".');
            }
            appId = appIdClaim;
        }
        else if (versionClaim === '2.0') {
            // Emulator, "2.0" puts the AppId in the "azp" claim.
            const appZClaim = identity.getClaimValue(AuthenticationConstants.AuthorizedParty);
            if (!appZClaim) {
                // No claim around AppID. Not Authorized.
                throw new Error('Unauthorized. "azp" claim is required on Emulator Token version "2.0".');
            }
            appId = appZClaim;
        }
        else {
            // Unknown Version. Not Authorized.
            throw new Error(`Unauthorized. Unknown Emulator Token version "${versionClaim}".`);
        }
        if (!(await credentials.isValidAppId(appId))) {
            throw new Error(`Unauthorized. Invalid AppId passed on token: ${appId}`);
        }
        return identity;
    }
    catch (ex) {
        console.error(ex);
        return null;
    }
}
exports.authenticateEmulatorToken = authenticateEmulatorToken;
//# sourceMappingURL=emulatorValidation.js.map