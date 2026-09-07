/**
 * 広島みらいアンケート受信用 Google Apps Script
 *
 * 【使い方】
 * 1. 回答を保存したいGoogleスプレッドシートを新規作成(またはお好きなシートを用意)
 * 2. スプレッドシートのメニュー「拡張機能」→「Apps Script」を開く
 * 3. 開いたエディタの中身を全て削除し、このファイルの内容を貼り付けて保存
 * 4. 画面右上「デプロイ」→「新しいデプロイ」
 *    - 種類の選択で歯車アイコン →「ウェブアプリ」を選択
 *    - 「次のユーザーとして実行」: 自分
 *    - 「アクセスできるユーザー」: 全員
 *    - 「デプロイ」をクリックし、表示された「ウェブアプリのURL」をコピー
 * 5. hiroshima-mirai.html 内の CONFIG.SHEET_ENDPOINT にそのURLを設定する
 *    例: var CONFIG = { SHEET_ENDPOINT: "https://script.google.com/macros/s/xxxxx/exec" };
 * 6. スプレッドシートの1行目に見出し行を作っておくと分かりやすいです(任意)。
 *    ニックネーム / Instagram / DM可否 / 年齢 / 出身地 / 広島歴 / 趣味 / 部活 /
 *    希望するコミュニティの形態 / やってみたいこと / 送信日時
 *
 * 【注意】
 * ニックネームやInstagramアカウントなど個人が識別できる情報を扱います。
 * スプレッドシートの共有範囲は必要最小限にし、アンケート回答者への説明(サイト側に記載済み)
 * と矛盾しない範囲でご利用ください。
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.nickname || "",
    data.instagram || "",
    data.dm_ok || "",
    data.age || "",
    data.hometown || "",
    data.hiroshima_history || "",
    data.hobby || "",
    data.club || "",
    data.community_form || "",
    data.community_do || "",
    data.submitted_at || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}
