export interface Claim {
    readonly type: string;
    readonly value: string;
}
/**
 * Represents a claims-based identity.
 */
export declare class ClaimsIdentity {
    readonly isAuthenticated: boolean;
    private readonly claims;
    constructor(claims: Claim[], isAuthenticated: boolean);
    /**
     * Returns a claim value (if its present)
     * @param  {string} claimType The claim type to look for
     * @returns {string|null} The claim value or null if not found
     */
    getClaimValue(claimType: string): string | null;
}
