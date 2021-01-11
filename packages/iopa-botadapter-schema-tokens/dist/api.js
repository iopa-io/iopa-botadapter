"use strict";
/// <reference path="./custom.d.ts" />
// tslint:disable
/**
 * Microsoft Bot Token API - V3.1
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: token
 * Contact: botframework@microsoft.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTokenApi = exports.UserTokenApiFactory = exports.UserTokenApiFp = exports.UserTokenApiFetchParamCreator = exports.BotSignInApi = exports.BotSignInApiFactory = exports.BotSignInApiFp = exports.BotSignInApiFetchParamCreator = exports.RequiredError = exports.BaseAPI = exports.COLLECTION_FORMATS = void 0;
const url = require("url");
const portableFetch = require("portable-fetch");
const BASE_PATH = 'https://token.botframework.com'.replace(/\/+$/, '');
/**
 *
 * @export
 */
exports.COLLECTION_FORMATS = {
    csv: ',',
    ssv: ' ',
    tsv: '\t',
    pipes: '|',
};
/**
 *
 * @export
 * @class BaseAPI
 */
class BaseAPI {
    constructor(configuration, basePath = BASE_PATH, fetch = portableFetch) {
        this.basePath = basePath;
        this.fetch = fetch;
        if (configuration) {
            this.configuration = configuration;
            this.basePath = configuration.basePath || this.basePath;
        }
    }
}
exports.BaseAPI = BaseAPI;
/**
 *
 * @export
 * @class RequiredError
 * @extends {Error}
 */
class RequiredError extends Error {
    constructor(field, msg) {
        super(msg);
        this.field = field;
    }
}
exports.RequiredError = RequiredError;
/**
 * BotSignInApi - fetch parameter creator
 * @export
 */
const BotSignInApiFetchParamCreator = function (configuration) {
    return {
        /**
         *
         * @param {string} state
         * @param {string} [codeChallenge]
         * @param {string} [emulatorUrl]
         * @param {string} [finalRedirect]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        botSignInGetSignInUrl(state, codeChallenge, emulatorUrl, finalRedirect, options = {}) {
            // verify required parameter 'state' is not null or undefined
            if (state === null || state === undefined) {
                throw new RequiredError('state', 'Required parameter state was null or undefined when calling botSignInGetSignInUrl.');
            }
            const localVarPath = `/api/botsignin/GetSignInUrl`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {};
            const localVarQueryParameter = {};
            if (state !== undefined) {
                localVarQueryParameter['state'] = state;
            }
            if (codeChallenge !== undefined) {
                localVarQueryParameter['code_challenge'] = codeChallenge;
            }
            if (emulatorUrl !== undefined) {
                localVarQueryParameter['emulatorUrl'] = emulatorUrl;
            }
            if (finalRedirect !== undefined) {
                localVarQueryParameter['finalRedirect'] = finalRedirect;
            }
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    };
};
exports.BotSignInApiFetchParamCreator = BotSignInApiFetchParamCreator;
/**
 * BotSignInApi - functional programming interface
 * @export
 */
const BotSignInApiFp = function (configuration) {
    return {
        /**
         *
         * @param {string} state
         * @param {string} [codeChallenge]
         * @param {string} [emulatorUrl]
         * @param {string} [finalRedirect]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        botSignInGetSignInUrl(state, codeChallenge, emulatorUrl, finalRedirect, options) {
            const localVarFetchArgs = exports.BotSignInApiFetchParamCreator(configuration).botSignInGetSignInUrl(state, codeChallenge, emulatorUrl, finalRedirect, options);
            return (fetch = portableFetch, basePath = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(response => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
    };
};
exports.BotSignInApiFp = BotSignInApiFp;
/**
 * BotSignInApi - factory interface
 * @export
 */
const BotSignInApiFactory = function (configuration, fetch, basePath) {
    return {
        /**
         *
         * @param {string} state
         * @param {string} [codeChallenge]
         * @param {string} [emulatorUrl]
         * @param {string} [finalRedirect]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        botSignInGetSignInUrl(state, codeChallenge, emulatorUrl, finalRedirect, options) {
            return exports.BotSignInApiFp(configuration).botSignInGetSignInUrl(state, codeChallenge, emulatorUrl, finalRedirect, options)(fetch, basePath);
        },
    };
};
exports.BotSignInApiFactory = BotSignInApiFactory;
/**
 * BotSignInApi - object-oriented interface
 * @export
 * @class BotSignInApi
 * @extends {BaseAPI}
 */
class BotSignInApi extends BaseAPI {
    /**
     *
     * @param {string} state
     * @param {string} [codeChallenge]
     * @param {string} [emulatorUrl]
     * @param {string} [finalRedirect]
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof BotSignInApi
     */
    botSignInGetSignInUrl(state, codeChallenge, emulatorUrl, finalRedirect, options) {
        return exports.BotSignInApiFp(this.configuration).botSignInGetSignInUrl(state, codeChallenge, emulatorUrl, finalRedirect, options)(this.fetch, this.basePath);
    }
}
exports.BotSignInApi = BotSignInApi;
/**
 * UserTokenApi - fetch parameter creator
 * @export
 */
const UserTokenApiFetchParamCreator = function (configuration) {
    return {
        /**
         *
         * @param {string} userId
         * @param {string} connectionName
         * @param {AadResourceUrls} aadResourceUrls
         * @param {string} [channelId]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenGetAadTokens(userId, connectionName, aadResourceUrls, channelId, options = {}) {
            // verify required parameter 'userId' is not null or undefined
            if (userId === null || userId === undefined) {
                throw new RequiredError('userId', 'Required parameter userId was null or undefined when calling userTokenGetAadTokens.');
            }
            // verify required parameter 'connectionName' is not null or undefined
            if (connectionName === null || connectionName === undefined) {
                throw new RequiredError('connectionName', 'Required parameter connectionName was null or undefined when calling userTokenGetAadTokens.');
            }
            // verify required parameter 'aadResourceUrls' is not null or undefined
            if (aadResourceUrls === null || aadResourceUrls === undefined) {
                throw new RequiredError('aadResourceUrls', 'Required parameter aadResourceUrls was null or undefined when calling userTokenGetAadTokens.');
            }
            const localVarPath = `/api/usertoken/GetAadTokens`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'POST' }, options);
            const localVarHeaderParameter = {};
            const localVarQueryParameter = {};
            if (userId !== undefined) {
                localVarQueryParameter['userId'] = userId;
            }
            if (connectionName !== undefined) {
                localVarQueryParameter['connectionName'] = connectionName;
            }
            if (channelId !== undefined) {
                localVarQueryParameter['channelId'] = channelId;
            }
            localVarHeaderParameter['Content-Type'] = 'application/json';
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            const needsSerialization = 'AadResourceUrls' !== 'string' ||
                localVarRequestOptions.headers['Content-Type'] ===
                    'application/json';
            localVarRequestOptions.body = needsSerialization
                ? JSON.stringify(aadResourceUrls || {})
                : aadResourceUrls || '';
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         *
         * @param {string} userId
         * @param {string} connectionName
         * @param {string} [channelId]
         * @param {string} [code]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenGetToken(userId, connectionName, channelId, code, options = {}) {
            // verify required parameter 'userId' is not null or undefined
            if (userId === null || userId === undefined) {
                throw new RequiredError('userId', 'Required parameter userId was null or undefined when calling userTokenGetToken.');
            }
            // verify required parameter 'connectionName' is not null or undefined
            if (connectionName === null || connectionName === undefined) {
                throw new RequiredError('connectionName', 'Required parameter connectionName was null or undefined when calling userTokenGetToken.');
            }
            const localVarPath = `/api/usertoken/GetToken`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {};
            const localVarQueryParameter = {};
            if (userId !== undefined) {
                localVarQueryParameter['userId'] = userId;
            }
            if (connectionName !== undefined) {
                localVarQueryParameter['connectionName'] = connectionName;
            }
            if (channelId !== undefined) {
                localVarQueryParameter['channelId'] = channelId;
            }
            if (code !== undefined) {
                localVarQueryParameter['code'] = code;
            }
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         *
         * @param {string} userId
         * @param {string} [channelId]
         * @param {string} [include]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenGetTokenStatus(userId, channelId, include, options = {}) {
            // verify required parameter 'userId' is not null or undefined
            if (userId === null || userId === undefined) {
                throw new RequiredError('userId', 'Required parameter userId was null or undefined when calling userTokenGetTokenStatus.');
            }
            const localVarPath = `/api/usertoken/GetTokenStatus`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {};
            const localVarQueryParameter = {};
            if (userId !== undefined) {
                localVarQueryParameter['userId'] = userId;
            }
            if (channelId !== undefined) {
                localVarQueryParameter['channelId'] = channelId;
            }
            if (include !== undefined) {
                localVarQueryParameter['include'] = include;
            }
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         *
         * @param {string} userId
         * @param {string} [connectionName]
         * @param {string} [channelId]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenSignOut(userId, connectionName, channelId, options = {}) {
            // verify required parameter 'userId' is not null or undefined
            if (userId === null || userId === undefined) {
                throw new RequiredError('userId', 'Required parameter userId was null or undefined when calling userTokenSignOut.');
            }
            const localVarPath = `/api/usertoken/SignOut`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'DELETE' }, options);
            const localVarHeaderParameter = {};
            const localVarQueryParameter = {};
            if (userId !== undefined) {
                localVarQueryParameter['userId'] = userId;
            }
            if (connectionName !== undefined) {
                localVarQueryParameter['connectionName'] = connectionName;
            }
            if (channelId !== undefined) {
                localVarQueryParameter['channelId'] = channelId;
            }
            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    };
};
exports.UserTokenApiFetchParamCreator = UserTokenApiFetchParamCreator;
/**
 * UserTokenApi - functional programming interface
 * @export
 */
const UserTokenApiFp = function (configuration) {
    return {
        /**
         *
         * @param {string} userId
         * @param {string} connectionName
         * @param {AadResourceUrls} aadResourceUrls
         * @param {string} [channelId]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenGetAadTokens(userId, connectionName, aadResourceUrls, channelId, options) {
            const localVarFetchArgs = exports.UserTokenApiFetchParamCreator(configuration).userTokenGetAadTokens(userId, connectionName, aadResourceUrls, channelId, options);
            return (fetch = portableFetch, basePath = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(response => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         *
         * @param {string} userId
         * @param {string} connectionName
         * @param {string} [channelId]
         * @param {string} [code]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenGetToken(userId, connectionName, channelId, code, options) {
            const localVarFetchArgs = exports.UserTokenApiFetchParamCreator(configuration).userTokenGetToken(userId, connectionName, channelId, code, options);
            return (fetch = portableFetch, basePath = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(response => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         *
         * @param {string} userId
         * @param {string} [channelId]
         * @param {string} [include]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenGetTokenStatus(userId, channelId, include, options) {
            const localVarFetchArgs = exports.UserTokenApiFetchParamCreator(configuration).userTokenGetTokenStatus(userId, channelId, include, options);
            return (fetch = portableFetch, basePath = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(response => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
        /**
         *
         * @param {string} userId
         * @param {string} [connectionName]
         * @param {string} [channelId]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenSignOut(userId, connectionName, channelId, options) {
            const localVarFetchArgs = exports.UserTokenApiFetchParamCreator(configuration).userTokenSignOut(userId, connectionName, channelId, options);
            return (fetch = portableFetch, basePath = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then(response => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    }
                    else {
                        throw response;
                    }
                });
            };
        },
    };
};
exports.UserTokenApiFp = UserTokenApiFp;
/**
 * UserTokenApi - factory interface
 * @export
 */
const UserTokenApiFactory = function (configuration, fetch, basePath) {
    return {
        /**
         *
         * @param {string} userId
         * @param {string} connectionName
         * @param {AadResourceUrls} aadResourceUrls
         * @param {string} [channelId]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenGetAadTokens(userId, connectionName, aadResourceUrls, channelId, options) {
            return exports.UserTokenApiFp(configuration).userTokenGetAadTokens(userId, connectionName, aadResourceUrls, channelId, options)(fetch, basePath);
        },
        /**
         *
         * @param {string} userId
         * @param {string} connectionName
         * @param {string} [channelId]
         * @param {string} [code]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenGetToken(userId, connectionName, channelId, code, options) {
            return exports.UserTokenApiFp(configuration).userTokenGetToken(userId, connectionName, channelId, code, options)(fetch, basePath);
        },
        /**
         *
         * @param {string} userId
         * @param {string} [channelId]
         * @param {string} [include]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenGetTokenStatus(userId, channelId, include, options) {
            return exports.UserTokenApiFp(configuration).userTokenGetTokenStatus(userId, channelId, include, options)(fetch, basePath);
        },
        /**
         *
         * @param {string} userId
         * @param {string} [connectionName]
         * @param {string} [channelId]
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        userTokenSignOut(userId, connectionName, channelId, options) {
            return exports.UserTokenApiFp(configuration).userTokenSignOut(userId, connectionName, channelId, options)(fetch, basePath);
        },
    };
};
exports.UserTokenApiFactory = UserTokenApiFactory;
/**
 * UserTokenApi - object-oriented interface
 * @export
 * @class UserTokenApi
 * @extends {BaseAPI}
 */
class UserTokenApi extends BaseAPI {
    /**
     *
     * @param {string} userId
     * @param {string} connectionName
     * @param {AadResourceUrls} aadResourceUrls
     * @param {string} [channelId]
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UserTokenApi
     */
    userTokenGetAadTokens(userId, connectionName, aadResourceUrls, channelId, options) {
        return exports.UserTokenApiFp(this.configuration).userTokenGetAadTokens(userId, connectionName, aadResourceUrls, channelId, options)(this.fetch, this.basePath);
    }
    /**
     *
     * @param {string} userId
     * @param {string} connectionName
     * @param {string} [channelId]
     * @param {string} [code]
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UserTokenApi
     */
    userTokenGetToken(userId, connectionName, channelId, code, options) {
        return exports.UserTokenApiFp(this.configuration).userTokenGetToken(userId, connectionName, channelId, code, options)(this.fetch, this.basePath);
    }
    /**
     *
     * @param {string} userId
     * @param {string} [channelId]
     * @param {string} [include]
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UserTokenApi
     */
    userTokenGetTokenStatus(userId, channelId, include, options) {
        return exports.UserTokenApiFp(this.configuration).userTokenGetTokenStatus(userId, channelId, include, options)(this.fetch, this.basePath);
    }
    /**
     *
     * @param {string} userId
     * @param {string} [connectionName]
     * @param {string} [channelId]
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UserTokenApi
     */
    userTokenSignOut(userId, connectionName, channelId, options) {
        return exports.UserTokenApiFp(this.configuration).userTokenSignOut(userId, connectionName, channelId, options)(this.fetch, this.basePath);
    }
}
exports.UserTokenApi = UserTokenApi;
//# sourceMappingURL=api.js.map