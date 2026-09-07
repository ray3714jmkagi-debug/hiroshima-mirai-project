// 管理画面のログイン状態を確認する共通処理。
// Cookieに入れた署名つきトークンを、SESSION_SECRETで検証する。
// (ファイル名が "_" で始まるものはCloudflare Pages Functionsのルーティング対象外になる)

const COOKIE_NAME = "hm_admin_session";

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function makeSessionCookie(env) {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7日間
  const payload = `admin.${expires}`;
  const sig = await hmac(env.SESSION_SECRET, payload);
  const value = `${payload}.${sig}`;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function isAuthenticated(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const [role, expiresStr, sig] = match[1].split(".");
  if (role !== "admin" || !expiresStr || !sig) return false;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const expectedSig = await hmac(env.SESSION_SECRET, `${role}.${expiresStr}`);
  return sig === expectedSig;
}
