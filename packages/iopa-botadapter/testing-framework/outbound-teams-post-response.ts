import { IopaApp, IopaEdgeContext } from 'iopa-types'
import { TeamsConfig, useTeamsTestingState } from './config-teams'

export function makePostTeamsResponse(
    app: IopaApp,
    options?: Partial<TeamsConfig>
) {
    return function postTeamsResponse(context: IopaEdgeContext, text: string) {
        const testingState = useTeamsTestingState(app, options)

        const activity = context.get('iopa.RawRequest').toJSON().body
        const teamsMessageId = activity.id
        const { teamsChannelId } = activity.channelData
        const params = {
            conversationId: `${teamsChannelId};messageid=${teamsMessageId}`,
            activityId: teamsMessageId,
        }

        const body = JSON.stringify({
            type: 'message',
            text,
            inputHint: 'acceptingInput',
            channelId: 'msteams',
            serviceUrl: 'https://smba.trafficmanager.net/amer/',
            conversation: {
                isGroup: true,
                conversationType: 'channel',
                tenantId: testingState.get('tenantId'),
                id: `${teamsChannelId};messageid=${teamsMessageId}`,
            },
            from: {
                id: testingState.get('botId'),
                name: testingState.get('botName').replace(/[()]/g, ' '),
            },
            recipient: {
                id: testingState.get('userId'),
                name: testingState.get('userName'),
                aadObjectId: testingState.get('userAadObjectId'),
            },
            replyToId: teamsMessageId,
        })

        return global.fetch(
            `https://smba.trafficmanager.net/amer/v3/conversations/${params.conversationId}/activities/${params.activityId}`,
            {
                body,
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    authorization:
                        'Bearer DUMMYTOKEN.asdasdasdasdasd.B408Lfw5z8YOIx-f3DFzfuT2mW8Dtcoyrz5QHBEjULxjmMb7vMXY5rrNh4MYdqw-asdadasdasdasd-asdasdasdasd-asdasdasdasd',
                    accept: '*/*',
                    'content-length': body.length.toString(),
                    'accept-encoding': 'gzip,deflate',
                    connection: 'close',
                },
                mode: 'cors',
                credentials: 'same-origin',
            }
        )
    }
}
