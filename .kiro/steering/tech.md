# Technology Stack

## Architecture

CLI ベースの画像変換ツール。シンプルなコマンドラインインターフェースを提供。

## Core Technologies

- **Language**: JavaScript/TypeScript（予定）
- **Runtime**: Node.js
- **Package Manager**: pnpm 10.26.2

## Key Libraries

（実装時に決定）
- 画像処理ライブラリ（sharp、imagemin-webp など候補）

## Development Standards

### Type Safety

TypeScript 採用予定。strict モードでの型安全性確保。

### Code Quality

- ESLint による静的解析
- Prettier によるコードフォーマット

### Testing

テストフレームワーク未定（実装時に決定）

## Development Environment

### Required Tools

- Node.js（LTS 推奨）
- pnpm 10.26.2

### Common Commands

```bash
# Dev: pnpm dev（予定）
# Build: pnpm build（予定）
# Test: pnpm test
```

## Key Technical Decisions

- **pnpm 採用**: 高速なパッケージ管理と厳密な依存関係解決
- **WebP 形式**: 現代的な画像フォーマットによるファイルサイズ最適化

---
_Document standards and patterns, not every dependency_
