# ドメイン管理メモ

取得したドメインの情報を記録し、更新忘れを防ぐための管理ファイルです。

## 🌐 管理中のドメイン情報

- **ドメイン名**: `abs-mart.net`
- **管理サービス**: Cloudflare Registrar
- **取得日（初期）**: 2026年2月28日（お名前.comで取得）
- **Cloudflareへ移管日**: 2026年5月5日
- **更新期限**: 2028年2月28日
- **更新料（目安）**: 約 $11.86 / 年（`.net` の卸売価格）
- **用途**: GitHub全体のポートフォリオ・アプリ公開用（aboshiDaisuke.github.io）

---

### 🔐 自動更新

- **Cloudflare Registrar は標準で自動更新ON**
- クレジットカードが有効である限り、期限の30日前に自動で引き落とされる
- 失効リスクを下げるためそのままONを推奨

### 📝 確認方法

- ダッシュボード: [https://dash.cloudflare.com](https://dash.cloudflare.com) → ドメイン → abs-mart.net
- 自動更新の設定確認: 「ドメイン登録」→「設定」

---

### 🔧 DNS設定（GitHub Pages用）

CloudflareのDNS管理画面で以下を設定済み：

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | abs-mart.net | 185.199.108.153 | DNS only（灰色雲） |
| A | abs-mart.net | 185.199.109.153 | DNS only |
| A | abs-mart.net | 185.199.110.153 | DNS only |
| A | abs-mart.net | 185.199.111.153 | DNS only |

⚠️ **プロキシは絶対にONにしない**（GitHub PagesのSSL証明書が壊れる）

---

### 📅 期限管理

- **2028年1月頃**: 自動更新が機能しているか念のため確認
  - クレジットカードの期限切れに注意
  - 自動更新ON状態のままか確認
