import { RouterApp } from 'iopa-types'
import { Adapter as BotFrameworkAdapter } from './adapter'
import { IopaBotAdapterContext } from './context'

export interface BotAdapterApp extends RouterApp<{}, IopaBotAdapterContext> {
    botadapter: BotFrameworkAdapter
}
