"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenIdMetadata = void 0;
/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// tslint:disable-next-line:no-var-requires no-require-imports
const getPem = require('rsa-pem-from-mod-exp');
// tslint:disable-next-line:no-var-requires no-require-imports
const base64url = require('base64url');
class OpenIdMetadata {
    constructor(url) {
        this.lastUpdated = 0;
        this.url = url;
    }
    async getKey(keyId) {
        // If keys are more than 5 days old, refresh them
        if (this.lastUpdated < Date.now() - 1000 * 60 * 60 * 24 * 5) {
            try {
                await this.refreshCache();
                // Search the cache even if we failed to refresh
                const key = this.findKey(keyId);
                return key;
            }
            catch (err) {
                //logger.error('Error retrieving OpenId metadata at ' + this.url + ', error: ' + err.toString());
                // fall through and return cached key on error
                throw err;
            }
        }
        else {
            // Otherwise read from cache
            const key = this.findKey(keyId);
            return key;
        }
    }
    async refreshCache() {
        try {
            const res = await fetch(this.url);
            if (res.ok) {
                const openIdConfig = (await res.json());
                const getKeyResponse = await fetch(openIdConfig.jwks_uri);
                if (getKeyResponse.ok) {
                    this.lastUpdated = Date.now();
                    this.keys = (await getKeyResponse.json()).keys;
                }
                else {
                    throw new Error(`Failed to load Keys: ${getKeyResponse.status}`);
                }
            }
            else {
                throw new Error(`Failed to load openID config: ${res.status}`);
            }
        }
        catch (ex) {
            console.error(ex);
        }
    }
    findKey(keyId) {
        if (!this.keys) {
            return null;
        }
        for (const key of this.keys) {
            if (key.kid === keyId) {
                if (!key.n || !key.e) {
                    // Return null for non-RSA keys
                    return null;
                }
                const modulus = base64url.toBase64(key.n);
                const exponent = key.e;
                return {
                    key: getPem(modulus, exponent),
                    endorsements: key.endorsements,
                };
            }
        }
        return null;
    }
}
exports.OpenIdMetadata = OpenIdMetadata;
//# sourceMappingURL=openIdMetadata.js.map