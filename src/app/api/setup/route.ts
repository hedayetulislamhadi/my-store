import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { runSeed } from "@/lib/seed";
import { SCHEMA_SQL } from "@/lib/schema-sql";

// The setup endpoint is DISABLED unless SETUP_SECRET is set in the environment
// (min. 24 chars). Remove SETUP_SECRET (or delete this route) once the database
// has been bootstrapped. The secret is only accepted in a request header — never
// in the URL, where it would end up in logs, browser history and referrers — and
// no secret or secret hash is stored in the repository.
const MIN_SECRET_LENGTH = 24;

function setupSecret(): string | null {
  const secret = process.env.SETUP_SECRET;
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

function readKey(req: Request): string | null {
  const bearer = req.headers.get("authorization");
  if (bearer && bearer.toLowerCase().startsWith("bearer ")) return bearer.slice(7).trim();
  return req.headers.get("x-setup-key");
}

function isAuthorized(key: string | null, secret: string): boolean {
  if (!key) return false;
  // Compare fixed-length digests in constant time.
  const a = crypto.createHash("sha256").update(key).digest();
  const b = crypto.createHash("sha256").update(secret).digest();
  return crypto.timingSafeEqual(a, b);
}

// Guarded, idempotent database bootstrap endpoint. Creates the schema (tables,
// enums, indexes, constraints) and seeds the catalog in a single authenticated
// request — needed because the database is only reachable from inside the
// deployment environment, not from the build sandbox.
//
// Auth: POST with header `Authorization: Bearer <SETUP_SECRET>` (or `x-setup-key`).
// Only requires DATABASE_URL — no migrations CLI or direct connection needed.
// Seeding is non-destructive: existing admin, products, stock and images are kept.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Split the generated DDL into individual statements. Prisma's DDL uses ";" only
// as a statement terminator (never inside string literals), so this is safe.
function statements(sql: string): string[] {
  return sql
    .split(";")
    .map((chunk) =>
      chunk
        .split("\n")
        .filter((line) => !line.trim().startsWith("--")) // drop comment lines
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);
}

async function ensureSchema(): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  for (const stmt of statements(SCHEMA_SQL)) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      created++;
    } catch (err) {
      // Ignore "already exists" / duplicate errors so the endpoint is idempotent.
      const msg = String(err instanceof Error ? err.message : err).toLowerCase();
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        skipped++;
        continue;
      }
      throw err;
    }
  }
  return { created, skipped };
}

// Report which critical env vars are present (booleans only — never values) so
// configuration gaps can be diagnosed without dashboard access.
function envStatus() {
  return {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL),
    NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
  };
}

async function handle(req: Request) {
  const secret = setupSecret();
  if (!secret) {
    // Endpoint is switched off — behave as if it does not exist.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isAuthorized(readKey(req), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const schema = await ensureSchema();
    const seeded = await runSeed(prisma);
    return NextResponse.json({ ok: true, schema, seeded, env: envStatus() });
  } catch (err) {
    console.error("[setup] Failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Setup failed", env: envStatus() },
      { status: 500 },
    );
  }
}

export const POST = handle;
