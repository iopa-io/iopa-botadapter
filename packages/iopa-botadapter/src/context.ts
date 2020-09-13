import { Activity } from 'iopa-botadapter-schema'
import { IopaContext, IopaBotReading } from 'iopa-types'
import { Adapter, IopaBotAdapterContext } from 'iopa-botadapter-types'
import { URN_BOTINTENT_LITERAL } from 'iopa-botcommander'
import { BotAdapterCapability } from './context-capability'
import { toIopaBotAdapterResponse } from './context-response-connector'
import { URN_BOTADAPTER } from './adapter-core'

/** Convert plain IopaContext into a method-enhanced IopaBotAdapterContext */
export function toIopaBotAdapterContext(
    plaincontext: IopaContext,
    adapter: Adapter,
    activity: Activity
): IopaBotAdapterContext {
    const context = plaincontext as IopaBotAdapterContext
    context['bot.Capability'] = new BotAdapterCapability(
        plaincontext,
        adapter,
        activity
    )

    context['iopa.Labels'].set(
        'user',
        activity.from.aadObjectId || activity.from.id
    )

    const reading: IopaBotReading = context as any

    const { teams } = context['bot.Capability']

    reading['bot.ActivityId'] = activity.id
    reading[
        'bot.ActivityType'
    ] = (((activity.type as unknown) as string).charAt(0).toUpperCase() +
        ((activity.type as unknown) as string).slice(1)) as any
    reading['bot.Channel'] = {
        id: teams.getChannelId(),
        name: teams.getChannelName(),
    }
    reading['bot.Conversation'] = adapter.getConversationReference(activity)
    reading['bot.From'] = {
        id: activity.from.aadObjectId,
        localid: activity.from.id,
        name: activity.from.name,
    }
    reading['bot.Intent'] = URN_BOTINTENT_LITERAL
    reading['bot.Provider'] = activity.channelId
    reading['bot.Recipient'] = {
        id: activity.recipient.aadObjectId,
        localid: activity.recipient.id,
        name: activity.recipient.name,
    }
    reading['bot.ServiceUrl'] = activity.serviceUrl
    context['bot.Source'] = URN_BOTADAPTER
    reading['bot.Session'] = undefined
    reading['bot.Team'] = { id: teams.getTeamId() }
    if (activity.text) {
        reading['bot.Text'] = activity.text
    }
    reading['bot.Timestamp'] = Date.now()

    context.response = toIopaBotAdapterResponse(plaincontext.response, context)
    return context
}
