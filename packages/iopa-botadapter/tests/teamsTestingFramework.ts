import { IopaApp, RouterApp, IopaContext, IopaEdgeContext } from 'iopa-types'
import { constants as IOPA, App, IopaMap } from 'iopa'
import Router from 'iopa-router'
import { setupServer } from 'msw/node'
import { Super } from '@iopa-edge/testing-framework'
import { EdgeApp } from '@iopa-edge/core'
import {
    makePostTeamsResponse,
    makeTeamsInboundTextFetch,
    interceptTeamsResponses,
} from '../testing-framework'

const { name, version } = require('../package.json')

let setupProxy: { listen: () => void; close: () => void }
let app: IopaApp
let teamsFetch: (text: string) => Super

beforeAll(() => {
    app = new App({ 'server.Version': version }) as IopaApp
    app.use(testMiddleware, 'entry-cloudflare')
    app.build()
    setupProxy = setupServer(...interceptTeamsResponses(app))
    setupProxy.listen()
    teamsFetch = makeTeamsInboundTextFetch(app, {})
})

afterAll(() => {
    setupProxy.close()
})

class VersionPlugin {
    public constructor(app: RouterApp<{}, IopaContext>) {
        app.get('/client/v1.0.0/version', (context: IopaContext) => {
            return context.response.send(
                `SuperIopa ${process.env.NODE_ENV} ${context['iopa.Url'].hostname} package ${name} version ${version}`
            )
        })
    }
}

class TeamsPlugin {
    public constructor(app: EdgeApp) {
        const postTeamsResponse = makePostTeamsResponse(app)

        app.post(
            '/client/v1.0.0/msbot/api/messages',
            async (context: IopaEdgeContext) => {
                const response = await postTeamsResponse(context, 'Hello World')
                expect(response.status).toBe(200)
                expect(await response.json()).toEqual({
                    id: expect.any(String),
                })
                return context.response.send('OK')
            }
        )
    }
}

function testMiddleware(app: EdgeApp) {
    // Default Iopa App (catch-all)
    app[IOPA.APPBUILDER.DefaultApp] = async (context: IopaContext, _) => {
        context.response['iopa.StatusCode'] = 404
        context.response.end('SUPER-404 Resource was not found')
    }

    // Core capabilities
    app.use(Router, 'Router')

    // Main App
    app.use(VersionPlugin, 'VersionPlugin')
    app.use(TeamsPlugin, 'TeamsPlugin')
}

describe('Test Helpers spec', () => {
    it('should fetch a token', async (done) => {
        const fetch = require('node-fetch')
        const result = await fetch(
            'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
            { method: 'POST', body: '' }
        )
        const data = await result.json()
        // eslint-disable-next-line @typescript-eslint/camelcase
        expect(data).toMatchObject({ token_type: 'Bearer' })
        done()
    })

    test('teamsFetch should result in related outputs', async (done) => {
        const result = await teamsFetch('help').expect(200).end()
        expect(await result.text()).toBe('OK')

        // verify that mock teams request is created properly
        const activity = result.context['iopa.RawRequest'].toJSON().body

        expect(activity).toMatchObject({
            text: '<at>sync (d)</at> help\n',
            type: 'message',
            channelId: 'msteams',
        })

        // verify that mock handler above results in resulting teams responses that are matched to outbound context
        expect(result.related.length).toBe(1)
        expect(result.related[0]).toMatchObject({
            type: 'message',
            text: 'Hello World',
            inputHint: 'acceptingInput',
            channelId: 'msteams',
            serviceUrl: 'https://smba.trafficmanager.net/amer/',
            recipient: {
                name: 'Guy Barnard',
            },
            replyToId: activity.id,
        })

        done()
    })
})
