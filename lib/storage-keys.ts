// Browser-storage keys that more than one module needs to know about (see lib/storage-cleanup.ts for
// how long each kind of data is kept). Add a new key here, and give it a lifetime in the cleanup.

// "who is logged in" marker (demo session)
export const USER_KEY = "mac-studio:user";
// when the logged-in browser was last used, to expire an abandoned login
export const USER_SEEN_KEY = "mac-studio:user-seen";
// email -> last time that account was used in this browser, to drop saved data of abandoned accounts
export const ACCOUNTS_SEEN_KEY = "mac-studio:accounts-seen";

// saved datasets / charts of one account (current format version, see lib/saved.ts)
export const SAVED_PREFIX = "mac-studio:saved:v3:";
// any saved-data key of any format version
export const SAVED_ANY_VERSION = /^mac-studio:saved:v(\d+):/;
// half-finished social logins (lib/social-auth.ts)
export const SOCIAL_PENDING_PREFIX = "mac-studio:social:";
