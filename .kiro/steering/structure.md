# Project Structure

## Organization Philosophy

シンプルな CLI ツールとして、機能ごとにモジュール化された構成を採用。

## Directory Patterns

### Source (`/src/`)
**Location**: `/src/`
**Purpose**: メインのソースコード
**Example**: `index.ts`, `converter.ts`

### CLI (`/src/cli/`)
**Location**: `/src/cli/`
**Purpose**: コマンドラインインターフェース関連
**Example**: 引数パース、ヘルプ表示

### Core (`/src/core/`)
**Location**: `/src/core/`
**Purpose**: 画像変換のコアロジック
**Example**: WebP 変換処理、品質設定

## Naming Conventions

- **Files**: kebab-case（例: `image-converter.ts`）
- **Functions**: camelCase（例: `convertToWebP`）
- **Classes**: PascalCase（例: `ImageConverter`）
- **Constants**: SCREAMING_SNAKE_CASE（例: `DEFAULT_QUALITY`）

## Import Organization

```typescript
// 外部ライブラリ
import sharp from 'sharp'

// 内部モジュール（相対パス）
import { convertImage } from './core/converter'
```

## Code Organization Principles

- 単一責任の原則に従い、モジュールを分離
- CLI と Core ロジックを明確に分離
- 再利用可能なユーティリティは共通モジュールに配置

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
