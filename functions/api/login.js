import { makeSessionCookie } from "./_auth.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "不正なリクエストです" }), { status: 400 });
  }

  const submitted = (body.password || "").trim();
  const expected = (env.ADMIN_PASSWORD || "").trim();
  if (!submitted || !expected || submitted !== expected) {
    return new Response(JSON.stringify({ ok: false, error: "パスワードが違います" }), { status: 401 });
  }

  const cookie = await makeSessionCookie(env);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
  });
}
