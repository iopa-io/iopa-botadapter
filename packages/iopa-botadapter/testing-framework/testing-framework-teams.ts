/* eslint-disable @typescript-eslint/camelcase */
import { IopaContext, IopaApp } from 'iopa-types'
import { rest } from 'msw'
import {
    makeFetch,
    random,
    addEdgeHeaders,
    getRelatedRecords,
} from '@iopa-edge/testing-framework'
import { TeamsConfig, useTeamsTestingState } from './config-teams'

export function makeTeamsInboundTextFetch(
    app: IopaApp,
    options: Partial<TeamsConfig> = {}
) {
    const superFetch = makeFetch(app)
        .use(addEdgeHeaders)
        .useRelated(getRelatedTeamsRecords)
    const testingState = useTeamsTestingState(app, options)

    return function teamsInboundHookText(text: string) {
        const teamsMessageId = random('1dddddddddddd')
        const teamsChannelId =
            '19:9051aea57b4a4a12a64ac7fc3b474a27@thread.skype'

        const body = JSON.stringify({
            text: `<at>${testingState.get('botName')}</at> ${text}\n`,
            textFormat: 'plain',
            attachments: [
                {
                    contentType: 'text/html',
                    content: `<div><div><span itemscope="" itemtype="http://schema.skype.com/Mention" itemid="0">${testingState.get(
                        'botName'
                    )}</span>&nbsp;${text}</div>\n</div>`,
                },
            ],
            type: 'message',
            timestamp: '2020-09-11T20:51:26.5323727Z',
            localTimestamp: '2020-09-11T15:51:26.5323727-05:00',
            id: teamsMessageId,
            channelId: 'msteams',
            serviceUrl: 'https://smba.trafficmanager.net/amer/',
            from: {
                id: testingState.get('userId'),
                name: testingState.get('userName'),
                aadObjectId: testingState.get('userAadObjectId'),
            },
            conversation: {
                isGroup: true,
                conversationType: 'channel',
                tenantId: testingState.get('tenantId'),
                id: `${teamsChannelId};messageid=${teamsMessageId}`,
            },
            recipient: {
                id: testingState.get('botId'),
                name: testingState.get('botName'),
            },
            entities: [
                {
                    mentioned: {
                        id: testingState.get('botId'),
                        name: testingState.get('botName'),
                    },
                    text: `<at>${testingState.get('botName')}</at>`,
                    type: 'mention',
                },
                {
                    locale: 'en-US',
                    country: 'US',
                    platform: 'Mac',
                    type: 'clientInfo',
                },
            ],
            channelData: {
                teamsChannelId,
                teamsTeamId: '19:f87713d7ec4c4ccb90d1695ea45c677e@thread.skype',
                channel: {
                    id: teamsChannelId,
                },
                team: {
                    id: '19:f87713d7ec4c4ccb90d1695ea45c677e@thread.skype',
                },
                tenant: {
                    id: testingState.get('tenantId'),
                },
            },
            locale: 'en-US',
        })

        return superFetch('/client/v1.0.0/msbot/api/messages', {
            method: 'post',
            headers: {
                'accept-encoding': 'gzip',
                authorization: '',
                'content-length': body.length.toString(),
                'content-type': 'application/json; charset=utf-8',
                'user-agent':
                    'Microsoft-SkypeBotApi (Microsoft-BotFramework/3.0)',
            },
            body,
        })
    }
}

export function makeTeamsInboundTeamSetup(
    app: IopaApp,
    options: Partial<TeamsConfig> = {}
) {
    const superFetch = makeFetch(app)
        .use(addEdgeHeaders)
        .useRelated(getRelatedTeamsRecords)
    const testingState = useTeamsTestingState(app, options)

    return function teamsInboundHookText(text: string) {
        const teamsMessageId = random('1dddddddddddd')
        const teamsChannelId =
            '19:f890b84f87194167a140527383217860@thread.tacv2'

        const body = JSON.stringify({
            membersAdded: [
                {
                    id: testingState.get('botId'),
                },
            ],
            type: 'conversationUpdate',
            timestamp: '2020-09-15T21:13:23.872Z',
            id: 'f:b644ea8b-9675-6f6c-bdc6-92d156177973',
            channelId: 'msteams',
            serviceUrl: 'https://smba.trafficmanager.net/amer/',
            from: {
                id:
                    '29:1EQUTJXDNE-g2_JSvyX2eKtyU1yWM8hGYn7pMjvw4_gHhs93OyhH0VJIBPR0rzKkz4Q9dYnIK7w6shTFrgsRevw',
                aadObjectId: '75193827-3e97-4b5a-8aa8-f506ffb07af0',
            },
            conversation: {
                isGroup: true,
                conversationType: 'channel',
                tenantId: testingState.get('tenantId'),
                id: teamsChannelId,
            },
            recipient: {
                id: testingState.get('botId'),
                name: testingState.get('botName').replace(/[()]/g, ' '),
            },
            channelData: {
                team: {
                    aadGroupId: 'aed6883b-2298-410a-b68a-9b5f9f1ed6f9',
                    name: 'sync 1 (615) 802-6790 Barnard',
                    id: '19:f890b84f87194167a140527383217860@thread.tacv2',
                },
                eventType: 'teamMemberAdded',
                tenant: {
                    id: testingState.get('tenantId'),
                },
            },
        })

        return superFetch('/client/v1.0.0/msbot/api/messages', {
            method: 'post',
            headers: {
                'accept-encoding': 'gzip',
                authorization: '',
                'content-length': body.length.toString(),
                'content-type': 'application/json; charset=utf-8',
                'user-agent':
                    'Microsoft-SkypeBotApi (Microsoft-BotFramework/3.0)',
            },
            body,
        })
    }
}

export interface TeamsRequestCard {
    activity: {
        type: 'message'
        attachmentLayout: string
        attachments: [
            {
                contentType: string
                content: {
                    body: {
                        text: string
                        type: 'TextBlock'
                    }[]
                    type: 'AdaptiveCard'
                    $schema: string
                    version: string
                    style: string
                }
            }
        ]
    }
    bot: {
        id: string
    }
    isGroup: boolean
    channelData: {
        channel: {
            id: string // '19:ba2b702a58374e89a30f493a77a9b2b2@thread.skype'
            name: string // '16159451234'
        }
        tenantId: string // 'fbe59500-b0cc-491b-aa3e-ffaf2699aec9'
    }
    members: []
    tenantId: string // 'fbe59500-b0cc-491b-aa3e-ffaf2699aec9'
}

export interface TeamsReplyText {
    type: 'message'
    text: string
    inputHint: 'acceptingInput'
    channelId: 'msteams'
    serviceUrl: 'https://smba.trafficmanager.net/amer/'
    conversation: {
        isGroup: boolean
        conversationType: 'channel'
        tenantId: string
        id: string
    }
    from: { id: string; name: string }
    recipient: {
        id: string
        name: string
        aadObjectId: string
    }
    replyToId: string
}

export const interceptTeamsResponses = (app: IopaApp) => {
    // const serverTestingProps = useTestingConfig<TeamsConfig>(app)

    return [
        rest.post(
            'https://smba.trafficmanager.net/amer/v3/conversations/:conversationId/activities/:activityId',
            (req, res, ctx) => {
                console.log(`[MSW-TEAMS] ${req.method} ${req.url}`)
                const activity = (req.body as unknown) as TeamsReplyText
                const { activityId } = req.params
                app.properties.get('server.Related').push({
                    id: activityId,
                    type: 'com.microsoft.msteams.conversation.activity',
                    body: activity,
                })
                return res(
                    ctx.json({
                        id: random('1dddddddddddd'),
                    })
                )
            }
        ),
        rest.post(
            'https://smba.trafficmanager.net/amer/v3/conversations',
            (req, res, ctx) => {
                console.log(`[MSW-TEAMS] ${req.method} ${req.url}`)
                const activity = (req.body as unknown) as TeamsRequestCard
                app.properties.get('server.Related').push({
                    id: activity.channelData.channel.name,
                    type: 'com.microsoft.msteams.conversation.activity',
                    body: activity,
                })
                return res(
                    ctx.json({
                        id: random('1dddddddddddd'),
                    })
                )
            }
        ),
        // https://graph.microsoft.com/beta/teams/:teamId/channels?$filter=description%20eq%20%2716159451234%27'
        rest.get(
            'https://graph.microsoft.com/beta/teams/:groupId/channels',
            (req, res, ctx) => {
                console.log(`[MSW-TEAMS] ${req.method} ${req.url}`)
                const { groupId } = req.params
                const filter = req.url.searchParams.get('$filter')
                const number = filter ? filter.split("'")[1] : 'unknown'

                return res(
                    ctx.json({
                        value: [
                            {
                                /** local id of the channel e.g.,  "19:ba2b702a58374e89a30f493a77a9b2b2@thread.skype" */
                                id:
                                    '19:ba2b702a58374e89a30f493a77a9b2b2@thread.skype',
                                /** displayname of the channel, initally set to virtual number without +, but can be user changed */
                                displayName: number,
                                /** description of the channel, always set to virtual number without + eg., 16152416286 */
                                description: number,
                                membershipType: 'standard',
                            },
                        ],
                    })
                )
            }
        ),
        rest.post(
            'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
            (req, res, ctx) => {
                console.log(`[MSW-TEAMS] ${req.method} ${req.url}`)
                return res(
                    ctx.json({
                        token_type: 'Bearer',
                        expires_in: 86399,
                        ext_expires_in: 86399,
                        access_token:
                            'DUMMYTOKEN.asdasdasdasdasd.B408Lfw5z8YOIx-f3DFzfuT2mW8Dtcoyrz5QHBEjULxjmMb7vMXY5rrNh4MYdqw-asdadasdasdasd-asdasdasdasd-asdasdasdasd',
                    })
                )
            }
        ),
    ]
}

export function getRelatedTeamsRecords(context: IopaContext, app: IopaApp) {
    const activity = context.get('iopa.RawRequest').toJSON().body
    const teamsMessageId = activity.id
    return getRelatedRecords<TeamsReplyText>(
        app,
        (req) => req.id === teamsMessageId
    )
}
