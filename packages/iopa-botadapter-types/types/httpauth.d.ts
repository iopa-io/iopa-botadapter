/**
 * Represents an IOPA, Fetch, Express or Restify http request object.
 *
 * > [!NOTE] This interface supports the framework and is not intended to be called directly for your code.
 */
export interface HttpRequest {
    /**
     * The full request url
     */
    url: string

    /**
     * Optional. The request body.
     */
    body?: any

    /***
     * The request headers.
     */
    headers: HttpHeaders

    /***
     * Optional. The request method.
     */
    method: string

    /**
     * When implemented in a derived class, adds a listener for an event.
     * The framework uses this method to retrieve the request body when the
     * [body](xref:botbuilder.WebRequest.body) property is `null` or `undefined`.
     *
     * @param event The event name.
     * @param args Arguments used to handle the event.
     *
     * @returns A reference to the request object.
     */
    on(event: string, ...args: any[]): any
}

/**
 * Represents an IOPA, Express or Restify http response object.
 *
 * > [!NOTE] This interface supports the framework and is not intended to be called directly for your code.
 */
export interface HttpResponse {
    /**
     *
     * Optional. The underlying socket.
     */
    socket?: any

    /**
     * When implemented in a derived class, sends a FIN packet.
     *
     * @param args The arguments for the end event.
     *
     * @returns A reference to the response object.
     */
    end(...args: any[]): any

    /**
     * When implemented in a derived class, sends the response.
     *
     * @param body The response payload.
     *
     * @returns A reference to the response object.
     */
    send(body: any): any

    /** The Http Status Text */
    status: number

    /** The Http Status Text */
    statusText: string

    body: any

    bodyUsed: boolean

    json?: Function
}

export interface HttpHeaders {
    /**
     * Set a header in this collection with the provided name and value. The name is
     * case-insensitive.
     * @param headerName The name of the header to set. This value is case-insensitive.
     * @param headerValue The value of the header to set.
     */
    set(headerName: string, headerValue: string | number): void

    /**
     * Get the header value for the provided header name, or undefined if no header exists in this
     * collection with the provided name.
     * @param headerName The name of the header.
     */
    get(headerName: string): string | undefined
}

export interface HttpAuthAppCredentials {
    appPassword: string
    appId: string
    oAuthEndpoint: string
    oAuthScope: string
    readonly tokenCacheKey: string

    signRequest(url: string, requestInit: Partial<HttpRequest>): Promise<void>

    getToken(forceRefresh?: boolean): Promise<string>
}
