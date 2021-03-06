import { IopaResponse, BotReading, BotResponseMethods } from 'iopa-types'

import {
    IopaBotAdapterContext,
    IopaBotAdapterResponse,
} from 'iopa-botadapter-types'

import {
    ConversationReference,
    Activity,
    ActivityTypes,
} from 'iopa-botadapter-schema'

import { MessageFactory, CardFactory } from 'iopa-botadapter-cards'

const MIN_TYPING_DURATION = 2200
const MIN_POST_MESSAGE_DELAY = 1500
const MAX_POST_MESSAGE_DELAY = 4000
const DEFAULT_DELAY_FOR_CARD = 3000
const DELAY_WHEN_DISABLED = 40

const s_bodyState = Symbol('urn:io:iopa:bot:response:bodystate')
const s_context = Symbol('urn:io:iopa:bot:response:context')

/** Convert plain IopaContext into a method-enhanced IopaBotAdapterContext */
export function toIopaBotAdapterResponse(
    plainresponse: Partial<IopaResponse>,
    context: IopaBotAdapterContext
): IopaBotAdapterResponse {
    const response = plainresponse as IopaBotAdapterResponse
    response[s_context] = context
    response.botːCapability = context.botːCapability

    response.send = ResponseHelpers.prototype.send
    response.sendAll = ResponseHelpers.prototype.sendAll
    response.say = ResponseHelpers.prototype.say
    response.card = ResponseHelpers.prototype.card
    response.shouldEndSession = ResponseHelpers.prototype.shouldEndSession
    response.showTypingIndicator = ResponseHelpers.prototype.showTypingIndicator
    response.hideTypingIndicator = ResponseHelpers.prototype.hideTypingIndicator
    response.status = ResponseHelpers.prototype.status
    response.fail = ResponseHelpers.prototype.fail
    response.status = ResponseHelpers.prototype.status
    response.isAwaitingMultiChoiceResponse =
        ResponseHelpers.prototype.isAwaitingMultiChoiceResponse

    response.botːShouldEndSession = false
    response.botːResponseHandled = false
    response.botːIsDelayDisabled = false
    response.iopaːStatusCode = 200

    return response
}

export class ResponseHelpers implements BotResponseMethods {
    say(this: IopaBotAdapterResponse, text: string): IopaBotAdapterResponse {
        if (this[s_bodyState]) {
            if (this[s_bodyState].text)
                this[s_bodyState].text = this[s_bodyState].text + '\n' + text
            else this[s_bodyState].text = text
        } else this[s_bodyState] = { text: text }

        this.botːResponseHandled = true

        return this
    }

    card(this: IopaBotAdapterResponse, card: any): IopaBotAdapterResponse {
        if (
            'text' in card ||
            'attachments' in card ||
            'image' in card ||
            'title' in card
        ) {
            this.say(card.text)

            if (card.attachments) {
                this[s_bodyState].attachments = card.attachments
            }

            if (card.image) {
                this[s_bodyState].image = card.image
            }

            if (card.title) {
                this[s_bodyState].attachments =
                    this[s_bodyState].attachments || []
                this[s_bodyState].attachments[0] =
                    this[s_bodyState].attachments[0] || {}
                this[s_bodyState].attachments[0]['text'] = card.title
            }
        } else {
            this[s_bodyState] = this[s_bodyState] || {}

            this[s_bodyState].attachments = this[s_bodyState].attachments || []

            if (card.type == 'card' && 'props' in card) {
                this[s_bodyState].attachments.push(
                    CardFactory.reactiveCard(card)
                )
            } else {
                this[s_bodyState].attachments.push(card)
            }
        }

        return this
    }

    /** Send response back to bot */
    async send(this: IopaBotAdapterResponse, body?: any) {
        if (body) {
            if (typeof body == 'string') {
                this.say(body)
            } else {
                this.card(body)
            }
        }

        let message: string
        let card: any

        if (this.iopaːStatusCode != 200) {
            // TO DO:: FORMAT ERROR
            message =
                'Unfortunately an error has occured:\n  ' +
                this.iopaːStatusCode +
                ' ' +
                this[s_bodyState].text
        } else {
            message = this[s_bodyState].text

            if (this[s_bodyState].attachments) {
                card = this[s_bodyState].attachments[0]
            }
        }

        this[s_bodyState] = undefined

        const hasMessage = message && message.length > 0

        if (!hasMessage && !card) {
            return
        }

        if (hasMessage && !card) {
            console.log(message)
            await this.botːCapability.sendActivity(MessageFactory.text(message))
        } else {
            console.log('card')
            await this.botːCapability.sendActivity(
                MessageFactory.attachment(card, message)
            )
        }
    }

    /** Helper method to indicate this response should end the dialog */
    shouldEndSession(
        this: IopaBotAdapterResponse,
        flag: boolean
    ): IopaBotAdapterResponse {
        this.botːShouldEndSession = flag
        return this
    }

    /** Helper method to set the status of the response */
    status(
        this: IopaBotAdapterResponse,
        statuscode: number
    ): IopaBotAdapterResponse {
        this.iopaːStatusCode = statuscode
        return this
    }

    /** Send a text string or card attachments, looping with delay if multiple provided */
    sendAll(
        this: IopaBotAdapterResponse,
        messages: (string | { text: string; attachments: any })[],
        typingDelay?: number
    ): Promise<void> {
        return asyncForEach(messages, async message => {
            const typingDuration = typingDelay || MIN_TYPING_DURATION
            let postMessageDelay

            if (typeof message == 'string') {
                postMessageDelay = postMessageDelayForText(message)
                this.say(message)
            } else {
                postMessageDelay = postMessageDelayForCard(message)
                this.card(message)
            }
            await this.showTypingIndicator()
            await delay(
                this.botːIsDelayDisabled ? DELAY_WHEN_DISABLED : typingDuration
            )
            await this.send()
            await this.hideTypingIndicator()
            await delay(
                this.botːIsDelayDisabled
                    ? DELAY_WHEN_DISABLED
                    : postMessageDelay
            )
        })
    }

    fail(
        this: IopaBotAdapterResponse,
        error: string,
        message: string,
        in_channel: string
    ): IopaBotAdapterResponse {
        this.iopaːStatusCode = 200

        this[s_bodyState] = {
            text: message + ': ' + error,
        }

        return this
    }

    async showTypingIndicator(): Promise<void> {
        const context: IopaBotAdapterContext = this[s_context]

        // Sending the Activity directly via the Adapter avoids other middleware and avoids setting the
        // responded flag. However this also requires tha tthe conversation reference details are explicitly added.

        let typingActivity: Partial<Activity> = {
            type: ActivityTypes.Typing,
            relatesTo: context.botːCapability.activity.relatesTo,
        }

        const conversationReference: Partial<ConversationReference> = context.botːCapability.adapter.getConversationReference(
            context.botːCapability.activity
        )

        typingActivity = context.botːCapability.adapter.applyConversationReference(
            typingActivity,
            conversationReference
        )

        await context.botːCapability.adapter.sendActivities(context, [
            typingActivity,
        ])

        // TO DO:   Keep sending every 2-5 seconds until no longer needed;  for now
        // just a single indicator is sent once
    }

    async hideTypingIndicator(): Promise<void> {
        return Promise.resolve()

        // TO DO:  Stop sending every 2 seconds
        // for now just a single indicator is sent, so hiding is a noop
    }

    isAwaitingMultiChoiceResponse(): boolean {
        return (
            (this[s_context] as BotReading).botːSession
                .botːisMultiChoicePrompt === true
        )
    }
}

//
// private methods
//

function delay(interval: number) {
    return new Promise((resolve, _reject) => {
        setTimeout(resolve, interval)
    })
}

function postMessageDelayForText(text) {
    const avgWordsPerMinute = 90
    const avgCharsPerWord = 5
    const wordCount = text.length / avgCharsPerWord
    const delay = (wordCount / avgWordsPerMinute) * 60 * 100
    const buffer = 900
    const final = clamp(
        MIN_POST_MESSAGE_DELAY,
        delay + buffer,
        MAX_POST_MESSAGE_DELAY
    )
    return final
}

function postMessageDelayForCard(card) {
    if (card.typingDelay !== undefined) {
        return card.postMessageDelay
    }
    if (card.text) {
        return postMessageDelayForText(card.text)
    }
    return DEFAULT_DELAY_FOR_CARD
}

function clamp(min, value, max) {
    return Math.min(max, Math.max(min, value))
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}
