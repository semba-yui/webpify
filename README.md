# webpify

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)](https://nodejs.org/)

画像ファイル（PNG/JPEG/GIF）を WebP 形式に変換する CLI ツール

## 機能

- 単一ファイルまたはディレクトリ一括変換
- 再帰的なディレクトリ走査
- 品質パラメータの指定（1-100）
- 出力先ディレクトリの指定
- 既存ファイルの上書き制御
- WebP ファイル一覧表示

## インストール

```bash
npm install -g webpify
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

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-o, --output <dir>` | 出力先ディレクトリ | 入力と同じ |
| `-q, --quality <n>` | 品質（1-100） | 100 |
| `-r, --recursive` | 再帰的に処理 | false |
| `-f, --force` | 既存ファイルを上書き | false |
| `--list` | WebP ファイル一覧表示 | - |
| `--quiet` | 統計情報を非表示 | false |
| `-v, --version` | バージョン表示 | - |
| `-h, --help` | ヘルプ表示 | - |

### 例

```bash
# 品質90で変換
webpify image.png -q 90

# 別ディレクトリに出力
webpify ./images -o ./webp-images

# 強制上書き + 再帰 + 静音
webpify ./images -r -f --quiet
```

## 要件

- Node.js 24.0.0 以上

## ライセンス

[MIT](LICENSE)

## 関連

- [コントリビューションガイド](CONTRIBUTING.md)
- [変更履歴](CHANGELOG.md)
- [セキュリティポリシー](SECURITY.md)
- [行動規範](CODE_OF_CONDUCT.md)
