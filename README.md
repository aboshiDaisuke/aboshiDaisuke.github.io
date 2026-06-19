# ABS Mart — ランディングページ

ブラウザだけで使える無料Webツール集 **[ABS Mart](https://abs-mart.net/)** の紹介用ランディングページです。
GitHub Pages でホスティングしています。

🔗 公開URL: **https://abs-mart.net/**

## 概要

インストール・登録不要で使えるブラウザツールを紹介する、静的な1ページサイトです。
HTML / CSS / 最小限の JavaScript のみで構成し、フレームワーク・ビルド工程はありません。

## 紹介しているツール

| # | ツール | リンク |
|---|---|---|
| 01 | SRT to FCPXML Editor（字幕変換） | https://abs-mart.net/srt-to-fcpxml/ |
| 02 | Media to MP3 Merger（音声結合） | https://abs-mart.net/media-to-mp3-merger/ |
| 03 | おみやげ配布あみだくじ（抽選） | https://abs-mart.net/amidakuji/ |
| 04 | 飲み会 予算管理 | https://abs-mart.net/BBQ/ |

## ファイル構成

```
index.html                     ページ本体
style.css                      スタイル
script.js                      ナビ追従・出現アニメ（IntersectionObserver）
favicon.svg                    ファビコン
abs_mart_hero.mp4              ヒーロー動画（自動再生・ループ）
abs_mart_hero_poster.jpg       ヒーロー動画のポスター/フォールバック画像
abs_mart_share.jpg             OG/Twitter共有画像
work_*_generated.jpg           各ツールのビジュアル
DOMAIN_MANAGEMENT.md           ドメイン管理メモ
_src/                          画像の原本（AI生成ソース・gitignore）
```

## 開発・確認

ビルド不要。ローカル確認は任意の静的サーバーで：

```sh
python3 -m http.server 8000
# → http://127.0.0.1:8000/
```

## デプロイ

**Cloudflare Pages** でホスティング（プロジェクト: `aboshidaisuke-github-io`）。
`main` ブランチへ push すると Cloudflare Pages が自動でビルド・公開します（ビルド工程なし／出力ディレクトリはルート）。

- 公開URL: https://abs-mart.net/ （カスタムドメイン）
- プレビューURL: https://aboshidaisuke-github-io.pages.dev/
- カスタムドメインは Cloudflare Pages 側で設定（リポジトリに `CNAME` ファイルは不要）
- ドメイン・DNS の詳細は [DOMAIN_MANAGEMENT.md](DOMAIN_MANAGEMENT.md) を参照
