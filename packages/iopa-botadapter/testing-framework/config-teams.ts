import { random, useTestingConfig } from '@iopa-edge/testing-framework'
import { IopaApp } from 'iopa-types'

export type TeamsConfig = {
    userId: string
    userAadObjectId: string
    botId: string
    botName: string
    userName: string
    tenantId: string
}

export function useTeamsTestingState(
    app: IopaApp,
    options?: Partial<TeamsConfig>
) {
    return useTestingConfig<TeamsConfig>(
        app,
        {
            userId: () =>
                random(
                    'dd:dAAAAAAAAA-ad_wwwwwwwwwwwwwwwwwwwwwwwwwww_wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww'
                ),
            userAadObjectId: () => random(),
            botId: () => random('dd:xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'),
            botName: 'sync (d)',
            userName: 'Guy Barnard',
            tenantId: 'fbe59500-b0cc-491b-aa3e-ffaf2699aec9',
        },
        options
    )
}
