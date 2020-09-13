"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtTokenExtractor = void 0;
/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const jwt = require("jsonwebtoken");
const claimsIdentity_1 = require("./claimsIdentity");
const endorsementsValidator_1 = require("./endorsementsValidator");
const openIdMetadata_1 = require("./openIdMetadata");
class JwtTokenExtractor {
    constructor(tokenValidationParameters, metadataUrl, allowedSigningAlgorithms) {
        this.tokenValidationParameters = { ...tokenValidationParameters };
        this.tokenValidationParameters.algorithms = allowedSigningAlgorithms;
        this.openIdMetadata = JwtTokenExtractor.getOrAddOpenIdMetadata(metadataUrl);
    }
    static getOrAddOpenIdMetadata(metadataUrl) {
        let metadata = JwtTokenExtractor.openIdMetadataCache.get(metadataUrl);
        if (!metadata) {
            metadata = new openIdMetadata_1.OpenIdMetadata(metadataUrl);
            JwtTokenExtractor.openIdMetadataCache.set(metadataUrl, metadata);
        }
        return metadata;
    }
    async getIdentityFromAuthHeader(authorizationHeader, channelId) {
        if (!authorizationHeader) {
            return null;
        }
        const parts = authorizationHeader.split(' ');
        if (parts.length === 2) {
            return await this.getIdentity(parts[0], parts[1], channelId);
        }
        return null;
    }
    async getIdentity(scheme, parameter, channelId) {
        // No header in correct scheme or no token
        if (scheme !== 'Bearer' || !parameter) {
            return null;
        }
        // Issuer isn't allowed? No need to check signature
        if (!this.hasAllowedIssuer(parameter)) {
            return null;
        }
        try {
            return await this.validateToken(parameter, channelId);
        }
        catch (err) {
            // tslint:disable-next-line:no-console
            console.error('JwtTokenExtractor.getIdentity:err!', err);
            throw err;
        }
    }
    hasAllowedIssuer(jwtToken) {
        const decoded = jwt.decode(jwtToken, { complete: true });
        const issuer = decoded.payload.iss;
        if (Array.isArray(this.tokenValidationParameters.issuer)) {
            return this.tokenValidationParameters.issuer.indexOf(issuer) !== -1;
        }
        if (typeof this.tokenValidationParameters.issuer === 'string') {
            return this.tokenValidationParameters.issuer === issuer;
        }
        return false;
    }
    async validateToken(jwtToken, channelId) {
        const decodedToken = jwt.decode(jwtToken, { complete: true });
        // Update the signing tokens from the last refresh
        const keyId = decodedToken.header.kid;
        const metadata = await this.openIdMetadata.getKey(keyId);
        if (!metadata) {
            throw new Error('Signing Key could not be retrieved.');
        }
        try {
            const decodedPayload = jwt.verify(jwtToken, metadata.key, this.tokenValidationParameters);
            // enforce endorsements in openIdMetadadata if there is any endorsements associated with the key
            const endorsements = metadata.endorsements;
            if (Array.isArray(endorsements) && endorsements.length !== 0) {
                const isEndorsed = endorsementsValidator_1.EndorsementsValidator.validate(channelId, endorsements);
                if (!isEndorsed) {
                    throw new Error(`Could not validate endorsement for key: ${keyId} with endorsements: ${endorsements.join(',')}`);
                }
            }
            if (this.tokenValidationParameters.algorithms) {
                if (this.tokenValidationParameters.algorithms.indexOf(decodedToken.header.alg) === -1) {
                    throw new Error(`"Token signing algorithm '${decodedToken.header.alg}' not in allowed list`);
                }
            }
            const claims = Object.keys(decodedPayload).reduce((acc, key) => {
                acc.push({ type: key, value: decodedPayload[key] });
                return acc;
            }, []);
            return new claimsIdentity_1.ClaimsIdentity(claims, true);
        }
        catch (err) {
            // tslint:disable-next-line:no-console
            console.error(`Error finding key for token. Available keys: ${metadata.key}`);
            throw err;
        }
    }
}
exports.JwtTokenExtractor = JwtTokenExtractor;
// Cache for OpenIdConnect configuration managers (one per metadata URL)
JwtTokenExtractor.openIdMetadataCache = new Map();
//# sourceMappingURL=jwtTokenExtractor.js.map