import { isAuthenticated } from "../_auth.js";

// 活動紹介カード・今後のスケジュールは、Cloudflare D1 に保存する。
// admin.html からの追加・編集・削除も、サイトが表示する一覧も、すべてここを経由する。

const SCHEMAS = {
  activities: ["icon", "role", "title", "description", "href", "link_label", "accent", "sort_order"],
  events: ["date", "start_time", "end_time", "title", "location", "tag"],
};

const ORDER_BY = {
  activities: "sort_order ASC, rowid ASC",
  events: "date ASC, start_time ASC, rowid ASC",
};

function requireValidType(type) {
  if (!SCHEMAS[type]) {
    return new Response(JSON.stringify({ ok: false, error: "不明なコンテンツ種別です" }), { status: 400 });
  }
  return null;
}

async function requireAuth(request, env) {
  const ok = await isAuthenticated(request, env);
  if (!ok) {
    return new Response(JSON.stringify({ ok: false, error: "ログインが必要です" }), { status: 401 });
  }
  return null;
}

// 一覧取得 / ?id=xxx で単体取得(認証不要、公開ページ用)
export async function onRequestGet({ request, env, params }) {
  const typeError = requireValidType(params.type);
  if (typeError) return typeError;

  const fields = SCHEMAS[params.type];
  const cols = ["id", ...fields, "created_at"].join(", ");
  const id = new URL(request.url).searchParams.get("id");

  if (id) {
    const row = await env.DB.prepare(`SELECT ${cols} FROM ${params.type} WHERE id = ?`).bind(id).first();
    return new Response(JSON.stringify({ contents: row ? [row] : [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { results } = await env.DB.prepare(
    `SELECT ${cols} FROM ${params.type} ORDER BY ${ORDER_BY[params.type]}`
  ).all();
  return new Response(JSON.stringify({ contents: results }), {
    headers: { "Content-Type": "application/json" },
  });
}

// 新規追加
export async function onRequestPost({ request, env, params }) {
  const authError = await requireAuth(request, env);
  if (authError) return authError;

  const typeError = requireValidType(params.type);
  if (typeError) return typeError;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "不正なリクエストです" }), { status: 400 });
  }

  const fields = SCHEMAS[params.type];
  const id = crypto.randomUUID();
  const cols = ["id", ...fields];
  const placeholders = cols.map(() => "?").join(", ");
  const values = [id, ...fields.map((f) => body[f] ?? null)];

  try {
    await env.DB.prepare(`INSERT INTO ${params.type} (${cols.join(", ")}) VALUES (${placeholders})`)
      .bind(...values)
      .run();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: `保存に失敗しました: ${e.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

// 編集(?id=xxx)
export async function onRequestPut({ request, env, params }) {
  const authError = await requireAuth(request, env);
  if (authError) return authError;

  const typeError = requireValidType(params.type);
  if (typeError) return typeError;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: "idが必要です" }), { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "不正なリクエストです" }), { status: 400 });
  }

  const fields = SCHEMAS[params.type];
  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const values = [...fields.map((f) => body[f] ?? null), id];

  let result;
  try {
    result = await env.DB.prepare(`UPDATE ${params.type} SET ${setClause} WHERE id = ?`)
      .bind(...values)
      .run();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: `更新に失敗しました: ${e.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!result.meta || result.meta.changes === 0) {
    return new Response(JSON.stringify({ ok: false, error: "対象が見つかりません" }), { status: 404 });
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
}

// 削除(?id=xxx)
export async function onRequestDelete({ request, env, params }) {
  const authError = await requireAuth(request, env);
  if (authError) return authError;

  const typeError = requireValidType(params.type);
  if (typeError) return typeError;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: "idが必要です" }), { status: 400 });
  }

  await env.DB.prepare(`DELETE FROM ${params.type} WHERE id = ?`).bind(id).run();
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
}
