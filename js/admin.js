// ============================================================================
// 管理画面(/admin.html)のロジック。
// ここでの「追加」「編集」「削除」は Cloudflare D1(サイト裏側のデータベース)に
// 直接書き込まれ、トップページの「活動紹介」「今後のスケジュール」にすぐ反映されます。
// ============================================================================
"use strict";

const FIELD_CONFIG = {
  activities: {
    label: "活動紹介",
    fields: [
      { key: "title", label: "活動名", type: "text", required: true },
      { key: "role", label: "ひとこと(タグ)", type: "text", required: true },
      { key: "icon", label: "アイコン(絵文字1つ、または images/xxx.jpg のような画像パス)", type: "text", required: false },
      { key: "description", label: "説明文", type: "textarea", required: true },
      { key: "href", label: "リンク先URL", type: "text", required: false },
      { key: "link_label", label: "リンクの文言", type: "text", required: false },
      { key: "accent", label: "アクセント色(navy / gold / maroon)", type: "text", required: false },
      { key: "sort_order", label: "表示順(小さいほど先に表示)", type: "number", required: false },
    ],
    itemTitle: (a) => `${a.title}(${a.role})`,
    itemBody: (a) => a.description,
  },
  events: {
    label: "今後のスケジュール",
    fields: [
      { key: "date", label: "日付", type: "date", required: true },
      { key: "start_time", label: "開始時刻", type: "time", required: false },
      { key: "end_time", label: "終了時刻", type: "time", required: false },
      { key: "title", label: "タイトル", type: "text", required: true },
      { key: "location", label: "場所", type: "text", required: false },
      { key: "tag", label: "タグ(例: ワークショップ)", type: "text", required: false },
    ],
    itemTitle: (e) => `${e.date} ${e.title}`,
    itemBody: (e) => `${e.start_time || ""}${e.end_time ? "〜" + e.end_time : ""} ${e.location || ""}`,
  },
};

const TYPES = Object.keys(FIELD_CONFIG);
let currentType = TYPES[0];
let currentItems = [];
let editingId = null;

const loginView = document.getElementById("login-view");
const panelView = document.getElementById("panel-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const tabsWrap = document.getElementById("tabs");
const formWrap = document.getElementById("form-wrap");
const listWrap = document.getElementById("list-wrap");
const statusEl = document.getElementById("status");

async function checkSession() {
  try {
    const res = await fetch("/api/session");
    const data = await res.json();
    return data.authenticated;
  } catch {
    return false;
  }
}

function showLogin() {
  loginView.hidden = false;
  panelView.hidden = true;
}

function showPanel() {
  loginView.hidden = true;
  panelView.hidden = false;
  renderTabs();
  renderForm();
  loadList();
}

function renderTabs() {
  tabsWrap.innerHTML = TYPES.map(
    (t) => `<button data-type="${t}" class="${t === currentType ? "is-active" : ""}">${FIELD_CONFIG[t].label}</button>`
  ).join("");
  tabsWrap.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentType = btn.dataset.type;
      editingId = null;
      renderTabs();
      renderForm();
      loadList();
    });
  });
}

function renderForm() {
  const config = FIELD_CONFIG[currentType];
  const editingItem = editingId ? currentItems.find((it) => it.id === editingId) : null;

  formWrap.innerHTML = `
    <div class="card">
      <h3 style="font-size:16px; margin-bottom:16px;">${config.label}を${editingItem ? "編集" : "追加"}</h3>
      <form id="add-form">
        ${config.fields
          .map((f) => {
            const value = editingItem ? (editingItem[f.key] ?? "") : "";
            const escaped = String(value).replace(/"/g, "&quot;");
            return `
            <div>
              <label for="field-${f.key}">${f.label}${f.required ? " *" : ""}</label>
              ${
                f.type === "textarea"
                  ? `<textarea id="field-${f.key}" ${f.required ? "required" : ""}>${value}</textarea>`
                  : `<input type="${f.type}" id="field-${f.key}" value="${escaped}" ${f.required ? "required" : ""}>`
              }
            </div>
          `;
          })
          .join("")}
        <div style="display:flex; gap:12px;">
          <button type="submit" class="btn btn-primary" style="width:auto;">${editingItem ? "更新する" : "追加する"}</button>
          ${editingItem ? `<button type="button" id="cancel-edit-btn" class="btn btn-outline">キャンセル</button>` : ""}
        </div>
      </form>
    </div>
  `;
  document.getElementById("add-form").addEventListener("submit", onSubmitForm);
  if (editingItem) {
    document.getElementById("cancel-edit-btn").addEventListener("click", () => {
      editingId = null;
      renderForm();
    });
  }
}

async function onSubmitForm(e) {
  e.preventDefault();
  const config = FIELD_CONFIG[currentType];
  const body = {};
  config.fields.forEach((f) => {
    const el = document.getElementById(`field-${f.key}`);
    const value = el.value.trim();
    if (value) body[f.key] = f.type === "number" ? Number(value) : value;
  });

  const isEdit = Boolean(editingId);
  statusEl.textContent = isEdit ? "更新しています..." : "追加しています...";
  try {
    const url = isEdit
      ? `/api/content/${currentType}?id=${encodeURIComponent(editingId)}`
      : `/api/content/${currentType}`;
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || "");
    }
    statusEl.textContent = isEdit ? "更新しました。" : "追加しました。";
    editingId = null;
    renderForm();
    loadList();
  } catch (err) {
    statusEl.textContent = err?.message || (isEdit ? "更新に失敗しました。" : "追加に失敗しました。");
  }
}

async function loadList() {
  const config = FIELD_CONFIG[currentType];
  listWrap.innerHTML = "<p>読み込み中...</p>";
  try {
    const res = await fetch(`/api/content/${currentType}`);
    const data = await res.json();
    if (!res.ok) throw new Error();
    currentItems = data.contents || [];

    if (currentItems.length === 0) {
      listWrap.innerHTML = "<p>まだ登録がありません。</p>";
      return;
    }
    listWrap.innerHTML = currentItems
      .map(
        (item) => `
        <div class="item">
          <div>
            <h4>${config.itemTitle(item)}</h4>
            <p>${(config.itemBody(item) || "").toString().slice(0, 100)}</p>
          </div>
          <div class="actions">
            <button data-edit-id="${item.id}" class="btn btn-outline" style="font-size:12px; padding:6px 14px;">編集</button>
            <button data-id="${item.id}" class="btn btn-danger">削除</button>
          </div>
        </div>
      `
      )
      .join("");
    listWrap.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => onDelete(btn.dataset.id));
    });
    listWrap.querySelectorAll("button[data-edit-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        editingId = btn.dataset.editId;
        renderForm();
        formWrap.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  } catch {
    listWrap.innerHTML = "<p>読み込みに失敗しました。</p>";
  }
}

async function onDelete(id) {
  if (!confirm("削除します。よろしいですか?")) return;
  statusEl.textContent = "削除しています...";
  try {
    const res = await fetch(`/api/content/${currentType}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    statusEl.textContent = "削除しました。";
    loadList();
  } catch {
    statusEl.textContent = "削除に失敗しました。";
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const password = document.getElementById("admin-password").value;
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      loginError.textContent = "パスワードが違います。";
      return;
    }
    showPanel();
  } catch {
    loginError.textContent = "ログインに失敗しました。";
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  showLogin();
});

(async function init() {
  const authed = await checkSession();
  if (authed) {
    showPanel();
  } else {
    showLogin();
  }
})();
