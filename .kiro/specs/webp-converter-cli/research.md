# Research & Design Decisions

## Summary

- **Feature**: webp-converter-cli
- **Discovery Scope**: New Feature（グリーンフィールド）
- **Key Findings**:
  - sharp は Node.js で最も高性能な画像処理ライブラリであり、WebP 変換に最適
  - Commander.js は軽量で TypeScript 対応の CLI フレームワークとして適切
  - ファイルサイズ削減率は平均 60% 程度が期待できる

## Research Log

### 画像処理ライブラリの選定

- **Context**: WebP 変換を行うためのコアライブラリを選定する必要がある
- **Sources Consulted**:
  - [sharp GitHub](https://github.com/lovell/sharp)
  - [sharp 公式ドキュメント](https://sharp.pixelplumbing.com/)
  - [npm sharp](https://www.npmjs.com/package/sharp)
- **Findings**:
  - sharp は libvips を使用し、ImageMagick/GraphicsMagick より 4-5 倍高速
  - PNG、JPEG、GIF、WebP、AVIF、TIFF をサポート
  - Node.js 24 以上が必要
  - 最新バージョン: 0.34.5
  - 非同期処理に対応し、Promise/async-await をサポート
  - メモリ効率が良く、大きな画像も小さなメモリフットプリントで処理可能
- **Implications**:
  - sharp を画像処理のコアライブラリとして採用
  - Node.js 24 LTS を推奨ランタイムとして設定

### CLI フレームワークの選定

- **Context**: コマンドライン引数のパースとヘルプ生成を行うフレームワークを選定
- **Sources Consulted**:
  - [Commander.js GitHub](https://github.com/tj/commander.js)
  - [npm compare: commander vs yargs](https://npm-compare.com/commander,yargs)
- **Findings**:
  - Commander.js: 軽量、シンプルな API、Git スタイルのサブコマンドをサポート
  - yargs: 豊富な機能、自動ヘルプ生成、ミドルウェアサポート
  - Commander.js は TypeScript 定義を提供（完全な型安全ではないが実用的）
  - cmd-ts は TypeScript ファーストだが、エコシステムが小さい
- **Implications**:
  - シンプルな CLI のため Commander.js を採用
  - 型定義は @types/commander または組み込み型を使用

### WebP 変換オプション

- **Context**: sharp での WebP 変換時に利用可能なオプションを調査
- **Sources Consulted**:
  - [sharp API Output ドキュメント](https://sharp.pixelplumbing.com/api-output/)
- **Findings**:
  - `quality`: 1-100（デフォルト 100）
  - `lossless`: ロスレス圧縮（デフォルト false）
  - `effort`: 圧縮努力度 0-6（デフォルト 4）
  - `toFile()` でファイル出力、`toBuffer()` でバッファ出力
  - 出力フォーマットはファイル拡張子から自動推論
- **Implications**:
  - 要件の品質オプション（1-100）は sharp のネイティブサポートと一致
  - デフォルト品質 100 で最高品質を維持

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Layered | CLI層とCore層の分離 | シンプル、理解しやすい | 複雑な機能拡張時に限界 | 本プロジェクトの規模に適切 |
| Hexagonal | ポート＆アダプターパターン | 高いテスタビリティ | 過剰設計になる可能性 | 小規模 CLI には過剰 |

**選択**: Layered Architecture（CLI層 + Core層の 2 層構造）

## Design Decisions

### Decision: 画像処理ライブラリ

- **Context**: WebP 変換を行うためのライブラリが必要
- **Alternatives Considered**:
  1. sharp — libvips ベースの高速画像処理
  2. imagemin-webp — imagemin エコシステムの一部
  3. cwebp（バイナリ）— Google の公式ツールをラップ
- **Selected Approach**: sharp を採用
- **Rationale**:
  - 最も高速（ImageMagick の 4-5 倍）
  - 広く使われており、メンテナンスが活発
  - 画像メタデータ（幅、高さ）の取得も可能（--list 機能に必要）
  - 単一ライブラリで入力フォーマット判定と WebP 出力が完結
- **Trade-offs**: ネイティブモジュールのため、一部環境でビルドが必要な場合がある
- **Follow-up**: インストール手順にプリビルドバイナリの利用を明記

### Decision: CLI フレームワーク

- **Context**: コマンドライン引数のパースとヘルプ生成が必要
- **Alternatives Considered**:
  1. Commander.js — 軽量、シンプル
  2. yargs — 高機能、ローカライズ対応
  3. cmd-ts — TypeScript ファースト
- **Selected Approach**: Commander.js を採用
- **Rationale**:
  - 要件のオプション構成がシンプル（サブコマンド不要）
  - 軽量で依存関係が少ない
  - 十分な TypeScript サポート
- **Trade-offs**: 複雑なバリデーションは手動実装が必要
- **Follow-up**: 品質値の範囲チェックなどは独自バリデーション関数で実装

### Decision: プロジェクト構成

- **Context**: TypeScript プロジェクトの構成を決定
- **Selected Approach**:
  - `/src/cli/` — CLI 層（引数パース、出力フォーマット）
  - `/src/core/` — コア層（画像変換ロジック）
  - `/src/ports/` — ポートインターフェース（外部依存の抽象化）
  - `/src/adapters/` — アダプター実装（sharp, fs のラッパー）
  - `/src/types/` — 型定義
  - `/tests/` — テストファイル（mocks, fixtures, integration, e2e）
- **Rationale**: steering の structure.md で定義されたパターンに従いつつ、テスト容易性のためポート/アダプターパターンを追加
- **Trade-offs**: 構造がやや複雑になるが、テスト容易性と保守性が向上

### Decision: テストフレームワーク

- **Context**: TypeScript プロジェクトのテストフレームワークを選定
- **Alternatives Considered**:
  1. vitest 4.x — 高速、ESM ネイティブ、Vite エコシステム
  2. Jest — 広く使われている、豊富なエコシステム
  3. Node.js test runner — 標準ライブラリ、依存なし
- **Selected Approach**: vitest 4.x を採用
- **Rationale**:
  - ESM ネイティブで TypeScript との相性が良い
  - Jest 互換 API で学習コストが低い
  - 高速な実行（HMR 対応）
  - `vi.fn()` によるモック機能が充実
- **Trade-offs**: Vite エコシステムへの依存が増える
- **Follow-up**: vitest.config.ts でカバレッジ設定を行う

### Decision: テスト容易性のための設計パターン

- **Context**: 外部依存（sharp, fs）をモックしやすくする
- **Selected Approach**: Ports & Adapters（依存性注入）パターン
- **Rationale**:
  - コアロジックが外部依存から分離される
  - テスト時にモック実装を注入可能
  - 将来的に別の画像処理ライブラリへの差し替えが容易
- **Trade-offs**: コード量が若干増加、間接層が追加される

## Risks & Mitigations

- **Risk 1**: sharp のネイティブモジュールがビルドできない環境がある
  - **Mitigation**: プリビルドバイナリを優先使用、README に対応 OS を明記
- **Risk 2**: 大量ファイル処理時のメモリ使用量
  - **Mitigation**: 並列処理数を制限、順次処理をデフォルトに
- **Risk 3**: サポート外画像フォーマットの誤認識
  - **Mitigation**: 拡張子と MIME タイプの両方でフォーマット判定

## References

- [sharp 公式ドキュメント](https://sharp.pixelplumbing.com/) — 画像処理 API リファレンス
- [Commander.js GitHub](https://github.com/tj/commander.js) — CLI フレームワーク
- [WebP 仕様](https://developers.google.com/speed/webp) — Google 公式 WebP ドキュメント
