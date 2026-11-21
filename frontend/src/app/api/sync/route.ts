import { NextResponse } from "next/server";
import { getSql } from "../../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ fallback: true }, { status: 503 });
    }

    const rows = await sql`
      SELECT watchlist, continue_watching, updated_at
      FROM avyra_sync_data
      WHERE user_email = ${email}
    `;

    if (rows.length === 0) {
      return NextResponse.json({
        watchlist: [],
        continueWatching: [],
        synced: true,
      });
    }

    return NextResponse.json({
      watchlist: rows[0].watchlist || [],
      continueWatching: rows[0].continue_watching || [],
      updatedAt: rows[0].updated_at,
      synced: true,
    });
  } catch (err) {
    console.error("Sync GET error:", err);
    return NextResponse.json({ error: "Failed to fetch sync data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, watchlist, continueWatching } = body || {};
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const sql = getSql();
    if (!sql) {
      return NextResponse.json({ fallback: true }, { status: 503 });
    }

    // Ensure row exists
    await sql`
      INSERT INTO avyra_sync_data (user_email)
      VALUES (${cleanEmail})
      ON CONFLICT (user_email) DO NOTHING
    `;

    if (Array.isArray(watchlist) && Array.isArray(continueWatching)) {
      const wJson = JSON.stringify(watchlist);
      const cwJson = JSON.stringify(continueWatching);
      await sql`
        UPDATE avyra_sync_data
        SET watchlist = ${wJson}::jsonb,
            continue_watching = ${cwJson}::jsonb,
            updated_at = NOW()
        WHERE user_email = ${cleanEmail}
      `;
    } else if (Array.isArray(watchlist)) {
      const wJson = JSON.stringify(watchlist);
      await sql`
        UPDATE avyra_sync_data
        SET watchlist = ${wJson}::jsonb,
            updated_at = NOW()
        WHERE user_email = ${cleanEmail}
      `;
    } else if (Array.isArray(continueWatching)) {
      const cwJson = JSON.stringify(continueWatching);
      await sql`
        UPDATE avyra_sync_data
        SET continue_watching = ${cwJson}::jsonb,
            updated_at = NOW()
        WHERE user_email = ${cleanEmail}
      `;
    }

    return NextResponse.json({ ok: true, synced: true });
  } catch (err) {
    console.error("Sync POST error:", err);
    return NextResponse.json({ error: "Failed to save sync data" }, { status: 500 });
  }
}
