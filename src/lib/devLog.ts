/**
 * Debug logging that is silent in production builds.
 * Use for developer diagnostics only; real errors go through console.error.
 */
export function devLog(...args: unknown[]): void {
    if (import.meta.env.DEV) {
        console.log(...args);
    }
}
