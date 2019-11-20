import { Activity } from 'iopa-botadapter-schema'
import { IopaContext, BotReading } from 'iopa-types'
import { Adapter, IopaBotAdapterContext } from 'iopa-botadapter-types'
import { BotAdapterCapability } from './context-capability'
import { toIopaBotAdapterResponse } from './context-response-connector'
import { URN_BOTINTENT_LITERAL } from 'iopa-botcommander'
import { URN_BOTADAPTER } from './adapter-core'

/** Convert plain IopaContext into a method-enhanced IopaBotAdapterContext */
export function toIopaBotAdapterContext(
    plaincontext: IopaContext,
    adapter: Adapter,
    activity: Activity
): IopaBotAdapterContext {
    const context = plaincontext as IopaBotAdapterContext
    context.botːCapability = new BotAdapterCapability(
        plaincontext,
        adapter,
        activity
    )

    context.iopaːLabels.set(
        'user',
        activity.from.aadObjectId || activity.from.id
    )

    const reading: BotReading = context as any

    const { teams } = context.botːCapability

    reading.botːActivityId = activity.id
    reading.botːActivityType = (((activity.type as unknown) as string)
        .charAt(0)
        .toUpperCase() + ((activity.type as unknown) as string).slice(1)) as any
    reading.botːChannel = {
        id: teams.getChannelId(),
        name: teams.getChannelName(),
    }
    reading.botːConversation = adapter.getConversationReference(activity)
    reading.botːFrom = {
        id: activity.from.aadObjectId,
        localid: activity.from.id,
        name: activity.from.name,
    }
    reading.botːIntent = URN_BOTINTENT_LITERAL
    reading.botːProvider = activity.channelId
    reading.botːRecipient = {
        id: activity.recipient.aadObjectId,
        localid: activity.recipient.id,
        name: activity.recipient.name,
    }
    reading.botːServiceUrl = activity.serviceUrl
    context.botːSource = URN_BOTADAPTER
    reading.botːSession = undefined
    reading.botːTeam = { id: teams.getTeamId() }
    if (activity.text) reading.botːText = activity.text
    reading.botːTimestamp = Date.now()

    context.response = toIopaBotAdapterResponse(plaincontext.response, context)
    return context
}
