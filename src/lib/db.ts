import Database from "better-sqlite3";
import path from "path";
import os from "os";
import crypto from "crypto";
import type { Session, Message, ToolCall } from "@/lib/types";

const DB_DIR = path.join(os.homedir(), ".pokeshrimp");
const DB_PATH = path.join(DB_DIR, "data.db");

let db: Database.Database | null = null;

/** Get or initialize the singleton database instance. */
export function getDb(): Database.Database {
  if (db) return db;

  // Ensure directory exists
  const fs = require("fs") as typeof import("fs");
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
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

  return db;
}

function uid(): string {
  return crypto.randomUUID();
}

// ─── Sessions ────────────────────────────────────────────────────

export async function createSession(title: string): Promise<Session> {
  const d = getDb();
  const id = uid();
  const now = new Date().toISOString();
  d.prepare(
    "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)"
  ).run(id, title, now, now);
  return { id, title, createdAt: now, updatedAt: now };
}

export async function listSessions(): Promise<Session[]> {
  const d = getDb();
  const rows = d
    .prepare(
      "SELECT id, title, created_at, updated_at FROM sessions ORDER BY updated_at DESC"
    )
    .all() as { id: string; title: string; created_at: string; updated_at: string }[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getSession(id: string): Promise<Session | null> {
  const d = getDb();
  const r = d
    .prepare(
      "SELECT id, title, created_at, updated_at FROM sessions WHERE id = ?"
    )
    .get(id) as { id: string; title: string; created_at: string; updated_at: string } | undefined;
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function deleteSession(id: string): Promise<void> {
  const d = getDb();
  d.prepare("DELETE FROM messages WHERE session_id = ?").run(id);
  d.prepare("DELETE FROM tool_calls WHERE session_id = ?").run(id);
  d.prepare("DELETE FROM sessions WHERE id = ?").run(id);
}

export async function touchSession(id: string): Promise<void> {
  const d = getDb();
  d.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    id
  );
}

// ─── Messages ────────────────────────────────────────────────────

export async function addMessage(
  sessionId: string,
  role: string,
  content: string
): Promise<Message> {
  const d = getDb();
  const id = uid();
  const now = new Date().toISOString();
  d.prepare(
    "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, sessionId, role, content, now);
  return {
    id,
    sessionId,
    role: role as Message["role"],
    content,
    createdAt: now,
  };
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  const d = getDb();
  const rows = d
    .prepare(
      "SELECT id, session_id, role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC"
    )
    .all(sessionId) as { id: string; session_id: string; role: string; content: string; created_at: string }[];
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    role: r.role as Message["role"],
    content: r.content,
    createdAt: r.created_at,
  }));
}

// ─── Tool Calls ──────────────────────────────────────────────────

export async function addToolCall(
  params: Omit<ToolCall, "id" | "createdAt">
): Promise<ToolCall> {
  const d = getDb();
  const id = uid();
  const now = new Date().toISOString();
  d.prepare(
    `INSERT INTO tool_calls (id, message_id, session_id, tool_name, server_name, args, result, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    params.messageId,
    params.sessionId,
    params.toolName,
    params.serverName,
    params.args,
    params.result,
    params.status,
    now
  );
  return { ...params, id, createdAt: now };
}

export async function updateToolCall(
  id: string,
  updates: { result?: string; status?: string }
): Promise<void> {
  const d = getDb();
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
  d.prepare(`UPDATE tool_calls SET ${sets.join(", ")} WHERE id = ?`).run(
    ...vals
  );
}
