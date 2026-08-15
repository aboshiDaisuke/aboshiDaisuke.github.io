# ABS Mart — ランディングページ

ブラウザだけで使える無料Webツール＆ゲーム集 **[ABS Mart](https://abs-mart.net/)** の紹介用ランディングページです。
GitHub Pages でホスティングしています。

🔗 公開URL: **https://abs-mart.net/**

## 概要

インストール・登録不要で使えるブラウザツールとゲームを紹介する、静的な1ページサイトです。
HTML / CSS / 最小限の JavaScript のみで構成し、フレームワーク・ビルド工程はありません。

## 紹介しているツール＆ゲーム

| # | ツール | リンク |
|---|---|---|
| 01 | SRT to FCPXML Editor（字幕変換） | https://abs-mart.net/srt-to-fcpxml/ |
| 02 | Media to MP3 Merger（音声結合） | https://abs-mart.net/media-to-mp3-merger/ |
| 03 | おみやげ配布あみだくじ（抽選） | https://abs-mart.net/amidakuji/ |
| 04 | 飲み会 予算管理 | https://abs-mart.net/BBQ/ |
| 05 | PDF Editor | https://abs-mart.net/pdf-editor/ |
| 06 | SUNSET DRIVE（3Dカートレーシング） | https://sunset-drive.pages.dev/ |
| 07 | 夜桜詣（3D散策ゲーム） | https://yozakura.pages.dev/ |

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
CNAME                          カスタムドメイン（abs-mart.net）
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

`main` ブランチへ push すると GitHub Pages が自動公開します。
ドメイン・DNS の設定は [DOMAIN_MANAGEMENT.md](DOMAIN_MANAGEMENT.md) を参照。
