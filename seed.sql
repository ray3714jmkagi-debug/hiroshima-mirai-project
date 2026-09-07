-- 初期データ投入用(D1データベース作成後に1回だけ実行する)。
-- 以降の追加・編集・削除は /admin.html から行う。

INSERT INTO activities (id, icon, role, title, description, href, link_label, accent, sort_order) VALUES
('seed-activity-1', '🏃', 'スポーツ振興', '広島OA', 'スポーツを通じて世代を越えた交流の場をつくり、広島にアクティブなつながりを増やしていく活動です。', 'https://site-9012713-3102-4019.mystrikingly.com/', 'サイトを見る', 'navy', 1),
('seed-activity-2', '📖', '人の魅力を発信', 'Life NAVI図鑑', '広島で暮らす一人ひとりの魅力にフォーカスし、写真とストーリーで発信するプロジェクトです。', 'https://www.instagram.com/life.navi_photography/', 'Instagramを見る', 'gold', 2),
('seed-activity-3', '✨', '子育て支援', 'Twinkle', '子育て中の家族が安心して頼れる居場所と情報をつくり、地域ぐるみで子育てを支えます。', 'https://www.instagram.com/twinkle_kosodateshien2024/', 'Instagramを見る', 'maroon', 3),
('seed-activity-4', '🌸', '女性支援', 'HBB', '女性同士がつながり、支え合いながら自分らしく挑戦できる環境づくりを行っています。', 'https://www.instagram.com/hbb202404/', 'Instagramを見る', 'navy', 4),
('seed-activity-5', '🤝', 'ワークショップ・アンケート', 'その他の活動', '4つの活動に加えて、みんなで学び合うワークショップの開催や、声を集めるアンケートも実施しています。開催予定はスケジュールページをご覧ください。', '#schedule', 'スケジュールを見る', 'gold', 5);
