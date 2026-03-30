import { NextRequest } from "next/server";
import crypto from "crypto";

// 서명 비밀키 (환경변수 또는 관리자 비밀번호 기반)
function getSecret(): string {
  return process.env.ADMIN_PASSWORD || "zjstjfxld1!2@3#";
}

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

/** HMAC 서명 기반 토큰 생성 — 어떤 serverless 인스턴스에서든 검증 가능 */
export function generateToken(): string {
  const expireAt = Date.now() + SESSION_TTL;
  const payload = `admin:${expireAt}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${expireAt}.${sig}`;
}

/** HMAC 서명 검증 — 인메모리 Map 불필요 */
export function isValidSession(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token) return false;

  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;

  const expireAt = Number(token.slice(0, dotIndex));
  const sig = token.slice(dotIndex + 1);

  if (isNaN(expireAt) || Date.now() > expireAt) return false;

  const expectedSig = crypto.createHmac("sha256", getSecret()).update(`admin:${expireAt}`).digest("hex");
  return sig === expectedSig;
}
