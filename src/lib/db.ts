import initSqlJs, { type Database } from "sql.js";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import type { Session, Message, ToolCall } from "@/lib/types";

const DB_DIR = path.join(os.homedir(), ".pokeshrimp");
const DB_PATH = path.join(DB_DIR, "data.db");

let db: Database | null = null;

/** Get or initialize the singleton database instance. */
export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tool_calls (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      server_name TEXT NOT NULL DEFAULT '',
      args TEXT NOT NULL DEFAULT '{}',
      result TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  persistDb();
  return db;
}

/** Flush in-memory database to disk. */
function persistDb(): void {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function uid(): string {
  return crypto.randomUUID();
}

// ─── Sessions ────────────────────────────────────────────────────

export async function createSession(title: string): Promise<Session> {
  const d = await getDb();
  const id = uid();
  const now = new Date().toISOString();
  d.run("INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)", [
    id,
    title,
    now,
    now,
  ]);
  persistDb();
  return { id, title, createdAt: now, updatedAt: now };
}

export async function listSessions(): Promise<Session[]> {
  const d = await getDb();
  const rows = d.exec(
    "SELECT id, title, created_at, updated_at FROM sessions ORDER BY updated_at DESC"
  );
  if (!rows.length) return [];
  return rows[0].values.map((r: unknown[]) => ({
    id: r[0] as string,
    title: r[1] as string,
    createdAt: r[2] as string,
    updatedAt: r[3] as string,
  }));
}

export async function getSession(id: string): Promise<Session | null> {
  const d = await getDb();
  const rows = d.exec(
    "SELECT id, title, created_at, updated_at FROM sessions WHERE id = ?",
    [id]
  );
  if (!rows.length || !rows[0].values.length) return null;
  const r = rows[0].values[0];
  return {
    id: r[0] as string,
    title: r[1] as string,
    createdAt: r[2] as string,
    updatedAt: r[3] as string,
  };
}

export async function deleteSession(id: string): Promise<void> {
  const d = await getDb();
  d.run("DELETE FROM messages WHERE session_id = ?", [id]);
  d.run("DELETE FROM tool_calls WHERE session_id = ?", [id]);
  d.run("DELETE FROM sessions WHERE id = ?", [id]);
  persistDb();
}

export async function touchSession(id: string): Promise<void> {
  const d = await getDb();
  d.run("UPDATE sessions SET updated_at = ? WHERE id = ?", [
    new Date().toISOString(),
    id,
  ]);
  persistDb();
}

// ─── Messages ────────────────────────────────────────────────────

export async function addMessage(
  sessionId: string,
  role: string,
  content: string
): Promise<Message> {
  const d = await getDb();
  const id = uid();
  const now = new Date().toISOString();
  d.run(
    "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
    [id, sessionId, role, content, now]
  );
  persistDb();
  return {
    id,
    sessionId,
    role: role as Message["role"],
    content,
    createdAt: now,
  };
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  const d = await getDb();
  const rows = d.exec(
    "SELECT id, session_id, role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC",
    [sessionId]
  );
  if (!rows.length) return [];
  return rows[0].values.map((r: unknown[]) => ({
    id: r[0] as string,
    sessionId: r[1] as string,
    role: r[2] as Message["role"],
    content: r[3] as string,
    createdAt: r[4] as string,
  }));
}

// ─── Tool Calls ──────────────────────────────────────────────────

export async function addToolCall(
  params: Omit<ToolCall, "id" | "createdAt">
): Promise<ToolCall> {
  const d = await getDb();
  const id = uid();
  const now = new Date().toISOString();
  d.run(
    `INSERT INTO tool_calls (id, message_id, session_id, tool_name, server_name, args, result, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      params.messageId,
      params.sessionId,
      params.toolName,
      params.serverName,
      params.args,
      params.result,
      params.status,
      now,
    ]
  );
  persistDb();
  return { ...params, id, createdAt: now };
}

export async function updateToolCall(
  id: string,
  updates: { result?: string; status?: string }
): Promise<void> {
  const d = await getDb();
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (updates.result !== undefined) {
    sets.push("result = ?");
    vals.push(updates.result);
  }
  if (updates.status !== undefined) {
    sets.push("status = ?");
    vals.push(updates.status);
  }
  if (sets.length === 0) return;
  vals.push(id);
  d.run(`UPDATE tool_calls SET ${sets.join(", ")} WHERE id = ?`, vals);
  persistDb();
}
