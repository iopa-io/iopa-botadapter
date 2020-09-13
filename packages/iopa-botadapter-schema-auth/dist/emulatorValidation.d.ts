/**
 * @module botbuilder
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as jwt from 'jsonwebtoken';
import { ClaimsIdentity } from './claimsIdentity';
import { ICredentialProvider } from './credentialProvider';
/**
 * Validates and Examines JWT tokens from the Bot Framework Emulator
 */
/**
 * TO BOT FROM EMULATOR: Token validation parameters when connecting to a channel.
 */
export declare const ToBotFromEmulatorTokenValidationParameters: jwt.VerifyOptions;
/**
 * Determines if a given Auth header is from the Bot Framework Emulator
 * @param  {string} authHeader Bearer Token, in the "Bearer [Long String]" Format.
 * @returns {boolean} True, if the token was issued by the Emulator. Otherwise, false.
 */
export declare function isTokenFromEmulator(authHeader: string): boolean;
/**
 * Validate the incoming Auth Header as a token sent from the Bot Framework Emulator.
 * A token issued by the Bot Framework will FAIL this check. Only Emulator tokens will pass.
 * @param  {string} authHeader The raw HTTP header in the format: "Bearer [longString]"
 * @param  {ICredentialProvider} credentials The user defined set of valid credentials, such as the AppId.
 * @returns {Promise<ClaimsIdentity>} A valid ClaimsIdentity.
 */
export declare function authenticateEmulatorToken(authHeader: string, credentials: ICredentialProvider, channelId: string): Promise<ClaimsIdentity>;
