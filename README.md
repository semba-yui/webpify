# webpify

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=semba-yui_webpify\&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=semba-yui_webpify)
[![DeepWiki](https://img.shields.io/badge/DeepWiki-semba--yui%2Fwebpify-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/semba-yui/webpify)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/semba-yui/webpify?utm_source=oss\&utm_medium=github\&utm_campaign=semba-yui%2Fwebpify\&labelColor=171717\&color=FF570A\&link=https%3A%2F%2Fcoderabbit.ai\&label=CodeRabbit+Reviews)

webpify は画像ファイル（PNG/JPEG/GIF）を WebP 形式に変換する CLI ツールです。

## 目次

- [機能](#機能)
- [インストール](#インストール)
- [使い方](#使い方)
  - [基本](#基本)
  - [オプション](#オプション)
  - [例](#例)
- [要件](#要件)
- [ライセンス](#ライセンス)
- [ドキュメント](#ドキュメント)
- [関連](#関連)

## 機能

- 単一ファイルまたはディレクトリ一括変換
- 再帰的なディレクトリ走査
- 品質パラメータの指定（1-100）
- lossless（可逆圧縮）モード対応
- 出力先ディレクトリの指定
- 既存ファイルの上書き制御
- WebP ファイル一覧表示

## インストール

```bash
pnpm add -g @semba-ryuichiro/webpify
```

## 使い方

### 基本

```bash
# 単一ファイルを変換
webpify image.png

# ディレクトリ内の画像を一括変換
webpify ./images

# 再帰的に変換
webpify ./images -r
```

### オプション

| オプション                | 説明              | デフォルト |
| -------------------- | --------------- | ----- |
| `-o, --output <dir>` | 出力先ディレクトリ       | 入力と同じ |
| `-q, --quality <n>`  | 品質（1-100）       | 100   |
| `-r, --recursive`    | 再帰的に処理          | false |
| `-f, --force`        | 既存ファイルを上書き      | false |
| `--lossless`         | 可逆圧縮モードで変換      | false |
| `--list`             | WebP ファイル一覧表示   | -     |
| `--absolute`         | 一覧表示時に絶対パスで表示   | false |
| `--quiet`            | 統計情報を非表示        | false |
| `-v, --version`      | バージョン表示         | -     |
| `-h, --help`         | ヘルプ表示           | -     |

### 例

```bash
# 品質90で変換
webpify image.png -q 90

# 別ディレクトリに出力
webpify ./images -o ./webp-images

# lossless（可逆圧縮）モードで変換
webpify image.png --lossless

# 強制上書き + 再帰 + 静音
webpify ./images -r -f --quiet
```

## 要件

- Node.js 22.0.0 以上

## ライセンス

[MIT](LICENSE)

## ドキュメント

- [クイックスタート](docs/getting-started.md) - インストールから最初の変換まで
- [コマンドリファレンス](docs/cli-reference.md) - すべてのオプションの詳細説明
- [ユースケース集](docs/use-cases.md) - 実践的な使用例とシナリオ

## 関連

- [コントリビューションガイド](CONTRIBUTING.md)
- [変更履歴](CHANGELOG.md)
- [セキュリティポリシー](SECURITY.md)
- [行動規範](CODE_OF_CONDUCT.md)
