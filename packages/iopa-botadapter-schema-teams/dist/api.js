'use strict'
//
// TEAMS API AS IF IT WAS CODE GENERATED BUT ACTUALLY CODED BY HAND
//
// DO NOT DELETE
//
Object.defineProperty(exports, '__esModule', { value: true })
const iopa_botadapter_schema_1 = require('iopa-botadapter-schema')
const url = require('url')
const portableFetch = require('portable-fetch')
const BASE_PATH = 'https://api.botframework.com'.replace(/\/+$/, '')
/** TeamsApi - fetch parameter creator */
exports.TeamsApiFetchParamCreator = function(configuration) {
    return {
        /** Fetches channel list for a given team */
        fetchChannelList(teamId, options = {}) {
            // verify required parameter 'parameters' is not null or undefined
            if (teamId === null || teamId === undefined) {
                throw new iopa_botadapter_schema_1.RequiredError(
                    'parameters',
                    'Required parameter parameters was null or undefined when calling conversationsCreateConversation.'
                )
            }
            const localVarPath = `v3/teams/${encodeURIComponent(
                String(teamId)
            )}/conversations`
            const localVarUrlObj = url.parse(localVarPath, true)
            const localVarRequestOptions = Object.assign(
                { method: 'GET' },
                options
            )
            const localVarHeaderParameter = {}
            const localVarQueryParameter = {}
            localVarUrlObj.query = Object.assign(
                {},
                localVarUrlObj.query,
                localVarQueryParameter,
                options.query
            )
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search
            localVarRequestOptions.headers = Object.assign(
                {},
                localVarHeaderParameter,
                options.headers
            )
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            }
        },
        /** Fetch details for a team */
        fetchTeamDetails(teamId, options = {}) {
            // verify required parameter 'parameters' is not null or undefined
            if (teamId === null || teamId === undefined) {
                throw new iopa_botadapter_schema_1.RequiredError(
                    'parameters',
                    'Required parameter parameters was null or undefined when calling conversationsCreateConversation.'
                )
            }
            const localVarPath = `v3/teams/${encodeURIComponent(
                String(teamId)
            )}`
            const localVarUrlObj = url.parse(localVarPath, true)
            const localVarRequestOptions = Object.assign(
                { method: 'GET' },
                options
            )
            const localVarHeaderParameter = {}
            const localVarQueryParameter = {}
            localVarUrlObj.query = Object.assign(
                {},
                localVarUrlObj.query,
                localVarQueryParameter,
                options.query
            )
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search
            localVarRequestOptions.headers = Object.assign(
                {},
                localVarHeaderParameter,
                options.headers
            )
            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            }
        },
    }
}
/** TeamsApi - functional programming interface */
exports.TeamsApiFp = function(configuration) {
    return {
        /** Fetches channel list for a given team */
        fetchChannelList(teamId, options) {
            const localVarFetchArgs = exports
                .TeamsApiFetchParamCreator(configuration)
                .fetchChannelList(teamId, options)
            return (fetch = portableFetch, basePath = BASE_PATH) => {
                return fetch(
                    basePath + localVarFetchArgs.url,
                    localVarFetchArgs.options
                ).then(response => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json()
                    } else {
                        throw response
                    }
                })
            }
        },
        /** Fetch details for a team */
        fetchTeamDetails(teamId, options) {
            const localVarFetchArgs = exports
                .TeamsApiFetchParamCreator(configuration)
                .fetchTeamDetails(teamId, options)
            return (fetch = portableFetch, basePath = BASE_PATH) => {
                return fetch(
                    basePath + localVarFetchArgs.url,
                    localVarFetchArgs.options
                ).then(response => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json()
                    } else {
                        throw response
                    }
                })
            }
        },
    }
}
/** TeamsApi - object-oriented interface */
class TeamsApi extends iopa_botadapter_schema_1.BaseAPI {
    /** Fetches channel list for a given team */
    teamsFetchChannelList(teamId, options) {
        return exports
            .TeamsApiFp(this.configuration)
            .fetchChannelList(teamId, options)(this.fetch, this.basePath)
    }
    /** Fetch details for a team */
    teamsFetchTeamDetails(teamId, options) {
        return exports
            .TeamsApiFp(this.configuration)
            .fetchTeamDetails(teamId, options)(this.fetch, this.basePath)
    }
}
exports.TeamsApi = TeamsApi
//# sourceMappingURL=api.js.map
