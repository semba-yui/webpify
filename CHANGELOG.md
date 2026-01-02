# 変更履歴

すべての重要な変更はこのファイルに記録されます。

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づいています。

## \[1.1.0] - 2026-01-02

### Added

- `--list` オプション使用時にファイルの相対パスを表示するように改善
  - サブディレクトリ内の同名ファイルを区別可能に
- `--absolute` オプションを追加（絶対パスで表示）

## \[1.0.9] - 2026-01-02

### Fixed

- npx で起動しない問題を改善

## \[1.0.8] - 2026-01-02

### Fixed

- npx で起動しない問題を改善

## \[1.0.7] - 2026-01-02

### Added

- ドキュメントの追加

### Fixed

- CI/CD パイプラインの publish 処理を修正

## \[1.0.6] - 2026-01-01

### Fixed

- CI 環境で E2E テストが失敗する問題に対応
- Node.js 22.11 互換性のため dependency-cruiser をダウングレード
- pnpm lockfile の catalog 設定を修正

## \[1.0.5] - 2026-01-01

### Added

- CI/CD パイプライン（GitHub Actions）
  - ビルド、テスト、リントの自動化
  - npm への自動公開
  - Claude Code 統合
  - Claude Code Review
- dependabot による依存関係の自動更新
- lefthook による Git フックの設定
- SonarQube 設定
- ユニットテストケースの追加

## \[1.0.4] - 2026-01-01

### Changed

- Node.js の最低サポートバージョンを 22 系へダウングレード

## \[1.0.3] - 2026-01-01

### Fixed

- devEngines が pnpm publish 時に誤変換される問題を修正（devEngines を削除）

## \[1.0.2] - 2026-01-01

### Fixed

- npm error "Unsupported URL Type runtime:" エラーを修正

## \[1.0.1] - 2026-01-01

### Fixed

- pnpm catalog 対応

## \[1.0.0] - 2026-01-01

### Added

- 単一ファイルの WebP 変換
- ディレクトリ一括変換
- 再帰的なディレクトリ走査（`-r` オプション）
- 品質パラメータ指定（`-q` オプション、1-100）
- 出力先ディレクトリ指定（`-o` オプション）
- 既存ファイル上書き制御（`-f` オプション）
- WebP ファイル一覧表示（`--list` オプション）
- サイレントモード（`--quiet` オプション）
- PNG/JPEG/GIF 形式のサポート
