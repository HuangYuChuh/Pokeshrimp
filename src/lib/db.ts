// Re-export from core — keeps API routes working without changes
import path from "path";
import os from "os";
import { SessionManager } from "@/core/session/manager";
import type { Session, Message, ToolCall } from "@/core/session/types";

const DB_PATH = path.join(os.homedir(), ".pokeshrimp", "data.db");

let manager: SessionManager | null = null;

function getManager(): SessionManager {
  if (!manager) {
    manager = new SessionManager(DB_PATH);
  }
  return manager;
}

export async function createSession(title: string): Promise<Session> {
  return getManager().createSession(title);
}

export async function listSessions(): Promise<Session[]> {
  return getManager().listSessions();
}

export async function getSession(id: string): Promise<Session | null> {
  return getManager().getSession(id);
}

export async function deleteSession(id: string): Promise<void> {
  return getManager().deleteSession(id);
}

export async function touchSession(id: string): Promise<void> {
  return getManager().touchSession(id);
}

export async function addMessage(
  sessionId: string,
  role: string,
  content: string,
): Promise<Message> {
  return getManager().addMessage(sessionId, role, content);
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  return getManager().getMessages(sessionId);
}

export async function addToolCall(params: Omit<ToolCall, "id" | "createdAt">): Promise<ToolCall> {
  return getManager().addToolCall(params);
}

export async function updateToolCall(
  id: string,
  updates: { result?: string; status?: string },
): Promise<void> {
  return getManager().updateToolCall(id, updates);
}
