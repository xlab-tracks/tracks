import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";

// Workers forbid sharing TCP connections across requests (a reused client
// hangs on the second request — prisma/prisma#28193), so the client is
// per-request: cache() scopes it to one request/render, and maxUses: 1 makes
// pg discard connections after use — real pooling happens upstream in
// Hyperdrive (prod) or PlanetScale's PgBouncer (local, port 6432).
export const getDb = cache(() => {
  let connectionString: string | undefined;
  try {
    const { env } = getCloudflareContext();
    connectionString = (env as { HYPERDRIVE?: { connectionString: string } })
      .HYPERDRIVE?.connectionString;
  } catch {
    // Not on Workers (plain `next dev` without bindings, tests) — fall through.
  }
  connectionString ??= process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "No database connection: set DATABASE_URL in .env (local) or bind HYPERDRIVE (Workers).",
    );
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, maxUses: 1 }),
  });
});

// Call sites import `prisma` as a value; delegate property access to the
// per-request client so they don't have to care about request scoping.
export const prisma = new Proxy({} as PrismaClient, {
  get: (_target, prop) => {
    const client = getDb();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
