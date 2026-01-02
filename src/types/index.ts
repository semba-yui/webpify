/**
 * サポートされる画像フォーマット
 */
export type SupportedFormat = 'png' | 'jpeg' | 'jpg' | 'gif';

/**
 * 変換オプション
 */
export interface ConvertOptions {
  /** 出力先パス（省略時は入力ファイルと同じディレクトリ） */
  output?: string | undefined;
  /** 変換品質（1-100、デフォルト: 80） */
  quality: number;
  /** 既存ファイルを上書きするかどうか */
  force: boolean;
}

/**
 * 単一ファイルの変換結果
 */
export interface ConversionResult {
  /** 入力ファイルパス */
  inputPath: string;
  /** 出力ファイルパス */
  outputPath: string;
  /** 入力ファイルサイズ（バイト） */
  inputSize: number;
  /** 出力ファイルサイズ（バイト） */
  outputSize: number;
  /** スキップされたかどうか */
  skipped: boolean;
  /** エラーメッセージ（エラー発生時のみ） */
  error?: string | undefined;
}

/**
 * バッチ変換の統計情報
 */
export interface ConversionStats {
  /** 処理対象のファイル総数 */
  totalFiles: number;
  /** 変換成功数 */
  successCount: number;
  /** スキップ数 */
  skippedCount: number;
  /** エラー数 */
  errorCount: number;
  /** 入力ファイルの合計サイズ（バイト） */
  totalInputSize: number;
  /** 出力ファイルの合計サイズ（バイト） */
  totalOutputSize: number;
}

/**
 * 画像情報（一覧表示用）
 */
export interface ImageInfo {
  /** ファイルパス */
  path: string;
  /** ファイルサイズ（バイト） */
  size: number;
  /** 画像の幅（ピクセル） */
  width: number;
  /** 画像の高さ（ピクセル） */
  height: number;
  /** 画像フォーマット */
  format: string;
}

/**
 * ファイルスキャンオプション
 */
export interface ScanOptions {
  /** サブディレクトリも再帰的にスキャンするか */
  recursive: boolean;
  /** フィルタリングする拡張子リスト */
  extensions: string[];
}

/**
 * CLI パースオプション
 */
export interface ParsedOptions {
  /** 入力パス（ファイルまたはディレクトリ） */
  input: string;
  /** 出力先パス */
  output?: string | undefined;
  /** 変換品質（1-100） */
  quality: number;
  /** 再帰的に処理するか */
  recursive: boolean;
  /** 既存ファイルを上書きするか */
  force: boolean;
  /** サイレントモード */
  quiet: boolean;
  /** WebP ファイル一覧表示モード */
  list: boolean;
  /** 一覧表示時に絶対パスで表示するか */
  absolutePath: boolean;
}

/**
 * 一覧表示用の画像アイテム
 */
export interface ImageListItem {
  /** ファイルパス */
  path: string;
  /** ファイルサイズ（バイト） */
  size: number;
  /** 画像の幅（ピクセル） */
  width: number;
  /** 画像の高さ（ピクセル） */
  height: number;
}
