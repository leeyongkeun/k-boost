import { NextRequest } from "next/server";

// --- Session token (서버 메모리) ---
export const sessions = new Map<string, number>(); // token → expireAt
export const SESSION_TTL = 4 * 60 * 60 * 1000; // 4시간

// --- Rate limiter (로그인 시도 제한) ---
export const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
export const MAX_ATTEMPTS = 5;
export const BLOCK_DURATION = 5 * 60 * 1000; // 5분 차단

export function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

export function isBlocked(ip: string): boolean {
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.blockedUntil) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordAttempt(ip: string): void {
  const entry = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
  entry.count++;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + BLOCK_DURATION;
  }
  loginAttempts.set(ip, entry);
}

export function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export function isValidSession(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token) return false;
  const expireAt = sessions.get(token);
  if (!expireAt) return false;
  if (Date.now() > expireAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}
