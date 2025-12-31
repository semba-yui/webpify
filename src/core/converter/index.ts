import path from 'node:path';
import type { FileSystemPort } from '../../ports/file-system.js';
import type { ImageProcessorPort } from '../../ports/image-processor.js';
import type { ConversionResult, ConversionStats, ConvertOptions, SupportedFormat } from '../../types/index.js';

/**
 * サポートされる拡張子のリスト
 */
const SUPPORTED_EXTENSIONS: SupportedFormat[] = ['png', 'jpeg', 'jpg', 'gif'];

/**
 * Converter の依存性
 */
export interface ConverterDependencies {
  fileSystem: FileSystemPort;
  imageProcessor: ImageProcessorPort;
}

/**
 * 進捗コールバック関数の型
 */
export type ProgressCallback = (result: ConversionResult, index: number, total: number) => void;

/**
 * Converter サービスインターフェース
 */
export interface ConverterService {
  /**
   * ファイルがサポートされた形式かどうか判定する
   * @param filePath ファイルパス
   * @returns サポートされている場合は true
   */
  isSupportedFormat(filePath: string): boolean;

  /**
   * 単一ファイルを WebP に変換する
   * @param inputPath 入力ファイルパス
   * @param options 変換オプション
   * @returns 変換結果
   */
  convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult>;

  /**
   * 複数ファイルを一括で WebP に変換する
   * @param inputPaths 入力ファイルパスの配列
   * @param options 変換オプション
   * @param onProgress 進捗コールバック（オプション）
   * @returns 変換統計情報
   */
  convertBatch(inputPaths: string[], options: ConvertOptions, onProgress?: ProgressCallback): Promise<ConversionStats>;
}

/**
 * Converter を生成するファクトリ関数
 * @param deps 依存性
 * @returns ConverterService インスタンス
 */
export function createConverter(deps: ConverterDependencies): ConverterService {
  const { fileSystem, imageProcessor } = deps;

  /**
   * ファイルの拡張子を取得する（小文字で返す）
   */
  function getExtension(filePath: string): string {
    return path.extname(filePath).slice(1).toLowerCase();
  }

  /**
   * 出力パスを決定する
   * @param inputPath 入力ファイルパス
   * @param output 出力先オプション（ディレクトリ）
   */
  function resolveOutputPath(inputPath: string, output?: string): string {
    const inputDir = path.dirname(inputPath);
    const inputBasename = path.basename(inputPath, path.extname(inputPath));
    const outputFilename = `${inputBasename}.webp`;

    if (output) {
      return path.join(output, outputFilename);
    }
    return path.join(inputDir, outputFilename);
  }

  /**
   * エラー結果を生成するヘルパー関数
   */
  function createErrorResult(inputPath: string, outputPath: string, error: string, inputSize = 0): ConversionResult {
    return {
      error,
      inputPath,
      inputSize,
      outputPath,
      outputSize: 0,
      skipped: false,
    };
  }

  return {
    async convert(inputPath: string, options: ConvertOptions): Promise<ConversionResult> {
      const outputPath = resolveOutputPath(inputPath, options.output);

      // 入力ファイルの存在確認（Requirement 1.4）
      const inputExists = await fileSystem.exists(inputPath);
      if (!inputExists) {
        return createErrorResult(inputPath, outputPath, `File not found: ${inputPath}`);
      }

      // サポート形式の検証（Requirement 1.5）
      const ext = getExtension(inputPath);
      if (!SUPPORTED_EXTENSIONS.includes(ext as SupportedFormat)) {
        return createErrorResult(
          inputPath,
          outputPath,
          `Unsupported format: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`,
        );
      }

      // 既存ファイルのスキップ処理（Requirement 5.1, 5.2）
      const outputExists = await fileSystem.exists(outputPath);
      if (outputExists && !options.force) {
        const inputStat = await fileSystem.stat(inputPath);
        return {
          inputPath,
          inputSize: inputStat.size,
          outputPath,
          outputSize: 0,
          skipped: true,
        };
      }

      // 出力ディレクトリが存在しない場合は作成
      const outputDir = path.dirname(outputPath);
      const outputDirExists = await fileSystem.exists(outputDir);
      if (!outputDirExists) {
        await fileSystem.mkdir(outputDir);
      }

      // 入力ファイルのサイズを取得
      const inputStat = await fileSystem.stat(inputPath);

      // WebP に変換
      try {
        const result = await imageProcessor.convertToWebP(inputPath, outputPath, {
          quality: options.quality,
        });

        return {
          inputPath,
          inputSize: inputStat.size,
          outputPath,
          outputSize: result.size,
          skipped: false,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return createErrorResult(inputPath, outputPath, `Image processing failed: ${errorMessage}`, inputStat.size);
      }
    },

    async convertBatch(
      inputPaths: string[],
      options: ConvertOptions,
      onProgress?: ProgressCallback,
    ): Promise<ConversionStats> {
      // 統計情報の初期化
      const stats: ConversionStats = {
        errorCount: 0,
        skippedCount: 0,
        successCount: 0,
        totalFiles: inputPaths.length,
        totalInputSize: 0,
        totalOutputSize: 0,
      };

      const total = inputPaths.length;

      // 各ファイルを順次変換
      for (const [index, inputPath] of inputPaths.entries()) {
        const result = await this.convert(inputPath, options);

        // 統計情報を更新
        stats.totalInputSize += result.inputSize;
        stats.totalOutputSize += result.outputSize;

        if (result.error) {
          stats.errorCount++;
        } else if (result.skipped) {
          stats.skippedCount++;
        } else {
          stats.successCount++;
        }

        // 進捗コールバックを呼び出し
        if (onProgress) {
          onProgress(result, index, total);
        }
      }

      return stats;
    },
    isSupportedFormat(filePath: string): boolean {
      const ext = getExtension(filePath);
      return SUPPORTED_EXTENSIONS.includes(ext as SupportedFormat);
    },
  };
}
