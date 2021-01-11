import { Activity, ResourceResponse, ConversationReference, ConversationsApi } from 'iopa-botadapter-schema';
import { HttpAuthAppCredentials, SimpleCredentialProvider } from 'iopa-botadapter-schema-auth';
import { IopaBotAdapterContext, AdapterCore as IAdapterCore } from 'iopa-botadapter-types';
import { IopaContext, RouterApp } from 'iopa-types';
export declare const INVOKE_RESPONSE_KEY = "urn:io.iopa.invokeResponse";
export declare const URN_BOTADAPTER = "urn:io.iopa:botadapater";
export declare const URN_BOTINTENT_LITERAL = "urn:io.iopa.bot:intent:literal";
/** The Iopa BotFrameworkAdapter */
export declare class AdapterCore implements IAdapterCore {
    protected readonly _app: RouterApp<{}, IopaBotAdapterContext>;
    readonly credentials: HttpAuthAppCredentials;
    protected readonly credentialsProvider: SimpleCredentialProvider;
    constructor(app: RouterApp<{}, IopaBotAdapterContext>);
    /** An asynchronous method that creates a turn context and runs the middleware pipeline
     * for an incoming activity from HTTP wire */
    invokeActivity(context: IopaContext, next: () => Promise<void>): Promise<void>;
    /** An asynchronous method that sends a set of outgoing activities to a channel server. */
    sendActivities(context: IopaBotAdapterContext, activities: Partial<Activity>[]): Promise<ResourceResponse[]>;
    /** An asynchronous method that replaces a previous activity with an updated version. */
    updateActivity(activity: Partial<Activity>): Promise<void>;
    /** An asynchronous method that deletes an existing activity.  */
    deleteActivity(reference: Partial<ConversationReference>): Promise<void>;
    /** Creates a connector client.  Used by Teams Extensions in this package, not external */
    createConversationsApiClient(serviceUrl: string): ConversationsApi;
    /** Allows for the overriding of authentication in unit tests. */
    private authenticateRequest;
    /**  Creates a turn context */
    createContext(activity: Partial<Activity>): IopaBotAdapterContext;
    private turnError;
    /** Gets/sets a error handler that will be called anytime an uncaught exception is raised during a turn */
    get onTurnError(): (context: IopaBotAdapterContext, error: Error) => Promise<void>;
    set onTurnError(value: (context: IopaBotAdapterContext, error: Error) => Promise<void>);
}
