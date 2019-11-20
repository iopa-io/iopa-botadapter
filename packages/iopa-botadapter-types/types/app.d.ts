import { RouterApp } from 'iopa-types'
import { Adapter as BotFrameworkAdapter } from './adapter'

export interface BotAdapterApp extends RouterApp {
    botadapter: BotFrameworkAdapter
}
