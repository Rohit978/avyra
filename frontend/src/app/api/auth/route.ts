import { NextResponse } from "next/server";
import { getSql, hashPassword, verifyPassword } from "../../../lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, email, password } = body || {};

    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json(
        { error: "Database not configured", fallback: true },
        { status: 503 }
      );
    }

    // Ensure tables exist if first run
    await sql`
      CREATE TABLE IF NOT EXISTS avyra_accounts (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS avyra_sync_data (
        user_email TEXT PRIMARY KEY REFERENCES avyra_accounts(email) ON DELETE CASCADE,
        watchlist JSONB NOT NULL DEFAULT '[]'::jsonb,
        continue_watching JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    if (action === "demo") {
      const demoEmail = "member@avyra.app";
      const demoName = "Cinema Member";
      const existing = await sql`SELECT email, name, created_at FROM avyra_accounts WHERE email = ${demoEmail}`;
      if (existing.length === 0) {
        const hash = hashPassword("demo-account-pass");
        await sql`
          INSERT INTO avyra_accounts (email, name, password_hash)
          VALUES (${demoEmail}, ${demoName}, ${hash})
          ON CONFLICT (email) DO NOTHING
        `;
      }
      await sql`
        INSERT INTO avyra_sync_data (user_email)
        VALUES (${demoEmail})
        ON CONFLICT (user_email) DO NOTHING
      `;
      const syncRows = await sql`
        SELECT watchlist, continue_watching FROM avyra_sync_data WHERE user_email = ${demoEmail}
      `;
      return NextResponse.json({
        user: {
          name: existing[0]?.name || demoName,
          email: demoEmail,
          createdAt: existing[0]?.created_at || new Date().toISOString(),
        },
        watchlist: syncRows[0]?.watchlist || [],
        continueWatching: syncRows[0]?.continue_watching || [],
        synced: true,
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT email, name, password_hash, created_at
      FROM avyra_accounts
      WHERE email = ${trimmedEmail}
    `;

    if (action === "signup") {
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 409 }
        );
      }
      const displayName =
        typeof name === "string" && name.trim()
          ? name.trim()
          : trimmedEmail.split("@")[0];
      const passHash = hashPassword(password);
      const inserted = await sql`
        INSERT INTO avyra_accounts (email, name, password_hash)
        VALUES (${trimmedEmail}, ${displayName}, ${passHash})
        RETURNING email, name, created_at
      `;
      await sql`
        INSERT INTO avyra_sync_data (user_email)
        VALUES (${trimmedEmail})
        ON CONFLICT (user_email) DO NOTHING
      `;
      return NextResponse.json({
        user: {
          name: inserted[0].name,
          email: inserted[0].email,
          createdAt: inserted[0].created_at,
        },
        watchlist: [],
        continueWatching: [],
        synced: true,
      });
    }

    // Default: signin
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "No account found with this email. Switch to Create Account." },
        { status: 401 }
      );
    }

    const account = existing[0];
    if (!verifyPassword(password, account.password_hash)) {
      return NextResponse.json(
        { error: "Incorrect password for this account." },
        { status: 401 }
      );
    }

    await sql`
      INSERT INTO avyra_sync_data (user_email)
      VALUES (${trimmedEmail})
      ON CONFLICT (user_email) DO NOTHING
    `;
    const syncRows = await sql`
      SELECT watchlist, continue_watching FROM avyra_sync_data WHERE user_email = ${trimmedEmail}
    `;

    return NextResponse.json({
      user: {
        name: account.name,
        email: account.email,
        createdAt: account.created_at,
      },
      watchlist: syncRows[0]?.watchlist || [],
      continueWatching: syncRows[0]?.continue_watching || [],
      synced: true,
    });
  } catch (err) {
    console.error("Auth API error:", err);
    return NextResponse.json(
      { error: "Authentication service error." },
      { status: 500 }
    );
  }
}
