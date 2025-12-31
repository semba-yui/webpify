# Requirements Document

## Introduction

webpify は画像ファイルを WebP 形式に変換する CLI ツールです。PNG、JPEG、GIF などの一般的な画像フォーマットを WebP 形式に変換し、Web パフォーマンスの向上に貢献します。単一ファイルの変換からディレクトリ内の一括変換まで対応し、品質パラメータの調整も可能です。また、既存の WebP 画像のサイズ一覧を出力する機能も備えています。

## Requirements

### Requirement 1: 単一ファイル変換

**Objective:** As a 開発者, I want 単一の画像ファイルを WebP 形式に変換したい, so that Web サイトで使用する画像を最適化できる

#### Acceptance Criteria

1. When ユーザーが画像ファイルパスを引数として指定した場合, the webpify shall 指定されたファイルを WebP 形式に変換する
2. When 変換が完了した場合, the webpify shall 元のファイル名に `.webp` 拡張子を付けた出力ファイルを生成する
3. The webpify shall PNG、JPEG、GIF 形式の入力ファイルをサポートする
4. If 指定されたファイルが存在しない場合, the webpify shall エラーメッセージを表示して終了コード 1 で終了する
5. If 指定されたファイルがサポートされていない形式の場合, the webpify shall エラーメッセージを表示して終了コード 1 で終了する

### Requirement 2: 出力先指定

**Objective:** As a 開発者, I want 変換後のファイルの出力先を指定したい, so that 任意のディレクトリに変換結果を保存できる

#### Acceptance Criteria

1. When ユーザーが `-o` または `--output` オプションで出力先を指定した場合, the webpify shall 指定されたパスに変換後のファイルを出力する
2. When 出力先オプションが指定されていない場合, the webpify shall 入力ファイルと同じディレクトリに出力する
3. If 出力先ディレクトリが存在しない場合, the webpify shall ディレクトリを自動的に作成する

### Requirement 3: 品質設定

**Objective:** As a 開発者, I want 変換時の品質レベルを指定したい, so that ファイルサイズと画質のバランスを調整できる

#### Acceptance Criteria

1. When ユーザーが `-q` または `--quality` オプションで品質値（1-100）を指定した場合, the webpify shall 指定された品質レベルで変換を実行する
2. When 品質オプションが指定されていない場合, the webpify shall デフォルト品質値 100 で変換を実行する
3. If 品質値が 1-100 の範囲外の場合, the webpify shall エラーメッセージを表示して終了コード 1 で終了する

### Requirement 4: ディレクトリ一括変換

**Objective:** As a 開発者, I want ディレクトリ内の複数の画像を一括で変換したい, so that 大量の画像を効率的に処理できる

#### Acceptance Criteria

1. When ユーザーがディレクトリパスを引数として指定した場合, the webpify shall ディレクトリ内のすべてのサポート対象画像ファイルを変換する
2. When `-r` または `--recursive` オプションが指定された場合, the webpify shall サブディレクトリ内の画像も再帰的に変換する
3. While ディレクトリ変換が進行中の場合, the webpify shall 処理中のファイル名と進捗を標準出力に表示する
4. If ディレクトリ内に変換対象のファイルが存在しない場合, the webpify shall 警告メッセージを表示して終了コード 0 で終了する

### Requirement 5: 上書き制御

**Objective:** As a 開発者, I want 既存ファイルの上書き動作を制御したい, so that 意図しないファイル上書きを防止できる

#### Acceptance Criteria

1. When 出力先に同名のファイルが既に存在する場合, the webpify shall デフォルトでスキップして警告メッセージを表示する
2. When `-f` または `--force` オプションが指定された場合, the webpify shall 既存ファイルを上書きする
3. When ファイルがスキップされた場合, the webpify shall スキップされたファイル名を標準出力に表示する

### Requirement 6: ヘルプとバージョン表示

**Objective:** As a 開発者, I want ツールの使い方とバージョン情報を確認したい, so that 正しくツールを使用できる

#### Acceptance Criteria

1. When ユーザーが `-h` または `--help` オプションを指定した場合, the webpify shall 使用方法とすべてのオプションの説明を表示する
2. When ユーザーが `-v` または `--version` オプションを指定した場合, the webpify shall ツールのバージョン番号を表示する
3. When 引数なしで実行された場合, the webpify shall ヘルプメッセージを表示する

### Requirement 7: 変換結果レポート

**Objective:** As a 開発者, I want 変換結果の統計情報を確認したい, so that 最適化の効果を把握できる

#### Acceptance Criteria

1. When 変換が完了した場合, the webpify shall 元のファイルサイズと変換後のファイルサイズを表示する
2. When 複数ファイルの変換が完了した場合, the webpify shall 処理したファイル数、成功数、スキップ数、合計サイズ削減量を表示する
3. Where `--quiet` オプションが指定された場合, the webpify shall 統計情報を表示せずにサイレントモードで実行する

### Requirement 8: WebP 画像サイズ一覧出力

**Objective:** As a 開発者, I want 既存の WebP 画像のサイズ情報を一覧表示したい, so that 画像アセットの状況を把握できる

#### Acceptance Criteria

1. When ユーザーが `--list` オプションを指定した場合, the webpify shall 指定されたパス内の WebP ファイルのサイズ一覧を表示する
2. When `--list` オプションでディレクトリを指定した場合, the webpify shall ディレクトリ内のすべての WebP ファイルを一覧表示する
3. When `--list` オプションと `-r` オプションを組み合わせた場合, the webpify shall サブディレクトリ内の WebP ファイルも再帰的に一覧表示する
4. The webpify shall 一覧表示時にファイル名、ファイルサイズ（バイト/KB/MB）、画像の幅と高さを表示する
5. When `--list` オプションが指定された場合, the webpify shall 変換処理を実行せずに一覧表示のみを行う
6. If 指定されたパスに WebP ファイルが存在しない場合, the webpify shall 「WebP ファイルが見つかりません」というメッセージを表示する
