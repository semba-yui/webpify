import path from 'node:path';
import type { ConversionResult, ConversionStats, ImageListItem } from '../../types/index.js';

/**
 * Reporter サービスのインターフェース
 */
export interface ReporterService {
  /**
   * 単一ファイルの変換結果を表示する
   * @param result - 変換結果
   * @param quiet - サイレントモードかどうか
   */
  reportConversion(result: ConversionResult, quiet: boolean): void;

  /**
   * 進捗を表示する
   * @param current - 現在の処理番号
   * @param total - 総ファイル数
   * @param fileName - 処理中のファイル名
   */
  reportProgress(current: number, total: number, fileName: string): void;

  /**
   * バッチ変換の統計情報を表示する
   * @param stats - 統計情報
   */
  reportStats(stats: ConversionStats): void;

  /**
   * WebP ファイル一覧を表示する
   * @param items - 画像アイテムのリスト
   * @param basePath - 相対パス計算の基準パス（省略時は絶対パスを表示）
   */
  reportImageList(items: ImageListItem[], basePath?: string): void;
}

/**
 * バイト数を人間が読みやすい形式にフォーマットする
 * @param bytes - バイト数
 * @returns フォーマットされた文字列（例: "10.00 KB"）
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * サイズ削減率を計算してフォーマットする
 * @param inputSize - 入力サイズ
 * @param outputSize - 出力サイズ
 * @returns フォーマットされた削減率（例: "50.0%" または "+20.0%"）
 */
function formatReduction(inputSize: number, outputSize: number): string {
  if (inputSize === 0) {
    return '0.0%';
  }
  const reduction = ((inputSize - outputSize) / inputSize) * 100;
  if (reduction < 0) {
    return `+${Math.abs(reduction).toFixed(1)}%`;
  }
  return `${reduction.toFixed(1)}%`;
}

/**
 * Reporter のファクトリ関数
 * @returns ReporterService のインスタンス
 */
export function createReporter(): ReporterService {
  return {
    reportConversion(result: ConversionResult, quiet: boolean): void {
      if (quiet) {
        return;
      }

      const fileName = path.basename(result.inputPath);

      if (result.error) {
        process.stdout.write(`Error: ${fileName} - ${result.error}\n`);
        return;
      }

      if (result.skipped) {
        process.stdout.write(`Skipped: ${fileName} (file already exists)\n`);
        return;
      }

      const inputSizeStr = formatSize(result.inputSize);
      const outputSizeStr = formatSize(result.outputSize);
      const reduction = formatReduction(result.inputSize, result.outputSize);

      process.stdout.write(`Converted: ${fileName} (${inputSizeStr} -> ${outputSizeStr}, ${reduction})\n`);
    },

    reportImageList(items: ImageListItem[], basePath?: string): void {
      if (items.length === 0) {
        process.stdout.write('WebP ファイルが見つかりません\n');
        return;
      }

      // 表示用パスを計算（basePath が指定されていれば相対パス、なければ絶対パス）
      const displayPaths = items.map((item) => {
        if (basePath) {
          const relativePath = path.relative(basePath, item.path);
          return relativePath || path.basename(item.path);
        }
        return item.path;
      });

      // 動的なカラム幅を計算（最小20、最大60文字）
      const maxPathLength = Math.max(...displayPaths.map((p) => p.length));
      const pathColumnWidth = Math.min(Math.max(maxPathLength + 2, 20), 60);

      process.stdout.write('\n--- WebP File List ---\n');
      process.stdout.write(
        `${'File'.padEnd(pathColumnWidth)} ${'Size'.padEnd(12)} ${'Width'.padEnd(8)} ${'Height'.padEnd(8)}\n`,
      );
      process.stdout.write(`${'-'.repeat(pathColumnWidth + 30)}\n`);

      for (const [index, item] of items.entries()) {
        const displayPath = displayPaths[index] ?? '';
        const sizeStr = formatSize(item.size);

        // 長いパスは省略表示
        const truncatedPath =
          displayPath.length > pathColumnWidth - 2 ? `...${displayPath.slice(-(pathColumnWidth - 5))}` : displayPath;

        process.stdout.write(
          `${truncatedPath.padEnd(pathColumnWidth)} ${sizeStr.padEnd(12)} ${String(item.width).padEnd(8)} ${String(item.height).padEnd(8)}\n`,
        );
      }
    },

    reportProgress(current: number, total: number, fileName: string): void {
      process.stdout.write(`[${current}/${total}] Processing: ${fileName}\n`);
    },

    reportStats(stats: ConversionStats): void {
      process.stdout.write('\n--- Conversion Summary ---\n');
      process.stdout.write(`Total files: ${stats.totalFiles}\n`);
      process.stdout.write(`Converted: ${stats.successCount}\n`);
      process.stdout.write(`Skipped: ${stats.skippedCount}\n`);
      process.stdout.write(`Errors: ${stats.errorCount}\n`);

      if (stats.successCount > 0 && stats.totalInputSize > 0) {
        const inputSizeStr = formatSize(stats.totalInputSize);
        const outputSizeStr = formatSize(stats.totalOutputSize);
        const reduction = formatReduction(stats.totalInputSize, stats.totalOutputSize);
        process.stdout.write(`Total size: ${inputSizeStr} -> ${outputSizeStr} (${reduction})\n`);
      }
    },
  };
}
