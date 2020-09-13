import { IopaResponse, BotResponseMethods, IopaBotCard } from 'iopa-types';
import { IopaBotAdapterContext, IopaBotAdapterResponse } from 'iopa-botadapter-types';
/** Convert plain IopaContext into a method-enhanced IopaBotAdapterContext */
export declare function toIopaBotAdapterResponse(plainresponse: Partial<IopaResponse>, context: IopaBotAdapterContext): IopaBotAdapterResponse;
export declare class ResponseHelpers implements BotResponseMethods {
    say(this: IopaBotAdapterResponse, text: string): IopaBotAdapterResponse;
    card(this: IopaBotAdapterResponse, card: any): IopaBotAdapterResponse;
    /** Send response back to bot */
    send(this: IopaBotAdapterResponse, body?: any): Promise<void>;
    /** Helper method to indicate this response should end the dialog */
    shouldEndSession(this: IopaBotAdapterResponse, flag: boolean): IopaBotAdapterResponse;
    /** Helper method to set the status of the response */
    status(this: IopaBotAdapterResponse, statuscode: number): IopaBotAdapterResponse;
    /** Send a text string or card attachments, looping with delay if multiple provided */
    sendAll(this: IopaBotAdapterResponse, messages: (string | IopaBotCard)[], typingDelay?: number): Promise<void>;
    fail(this: IopaBotAdapterResponse, error: string, message: string, in_channel: string): IopaBotAdapterResponse;
    showTypingIndicator(): Promise<void>;
    hideTypingIndicator(): Promise<void>;
    isAwaitingMultiChoiceResponse(): boolean;
}
