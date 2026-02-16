/**
 * Visitor ID Utility
 * 
 * Generates and persists a unique visitor ID using cookies.
 * This is used to tie orders to a specific browser/device
 * without requiring user authentication.
 */

const VISITOR_COOKIE_NAME = 'rda_visitor_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

/**
 * Get the current visitor ID from cookies, or generate a new one.
 */
export function getVisitorId(): string {
    if (typeof document === 'undefined') return '';

    // Try to read from cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === VISITOR_COOKIE_NAME && value) {
            return value;
        }
    }

    // Generate new visitor ID and set cookie
    const visitorId = crypto.randomUUID();
    document.cookie = `${VISITOR_COOKIE_NAME}=${visitorId};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
    return visitorId;
}
