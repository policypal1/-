import { kv } from '@vercel/kv';

// Keys we will use:
// links:<id>           -> { url, owner, meta, createdAt }
// events:<id>          -> list of event objects for link <id>
// link_ids             -> set of all link ids (optional admin convenience)

export { kv };
