import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal config: ISR and Cache Components are intentionally off (see
// CLAUDE.md), so no incremental cache (R2/KV/D1) is needed — SSR and static
// assets work out of the box.
export default defineCloudflareConfig({});
