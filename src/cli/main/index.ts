import path from 'node:path';
import type { ConverterService, FileScannerService, ImageInspectorService } from '../../core/index.js';
import type { ConversionResult, ImageListItem } from '../../types/index.js';
import type { ArgumentParserService } from '../argument-parser/index.js';
import type { ReporterService } from '../reporter/index.js';

/**
 * サポートされる変換対象の拡張子
 */
const CONVERT_EXTENSIONS = ['png', 'jpeg', 'jpg', 'gif'];

/**
 * WebP ファイルの拡張子
 */
const WEBP_EXTENSIONS = ['webp'];

/**
 * Main サービスの依存性
 */
export interface MainDependencies {
  argumentParser: ArgumentParserService;
  reporter: ReporterService;
  converter: ConverterService;
  fileScanner: FileScannerService;
  imageInspector: ImageInspectorService;
}

/**
 * Main サービスインターフェース
 */
export interface MainService {
  /**
   * CLI のメイン処理を実行する
   * @param argv コマンドライン引数（process.argv 形式）
   * @returns 終了コード（0: 成功, 1: エラー）
   */
  run(argv: string[]): Promise<number>;
}

/**
 * Main サービスを生成するファクトリ関数
 * @param deps 依存性
 * @returns MainService インスタンス
 */
export function createMain(deps: MainDependencies): MainService {
  const { argumentParser, reporter, converter, fileScanner, imageInspector } = deps;

  /**
   * 一覧表示モードを実行する
   */
  async function executeListMode(inputPath: string, recursive: boolean, absolutePath: boolean): Promise<number> {
    const files = await fileScanner.scan(inputPath, {
      extensions: WEBP_EXTENSIONS,
      recursive,
    });

    const imageInfos = await imageInspector.getInfoBatch(files);

    const items: ImageListItem[] = imageInfos.map((info) => ({
      height: info.height,
      path: info.path,
      size: info.size,
      width: info.width,
    }));

    // absolutePath が false の場合は basePath を渡して相対パスを表示
    const basePath = absolutePath ? undefined : path.resolve(inputPath);
    reporter.reportImageList(items, basePath);
    return 0;
  }

  /**
   * 単一ファイル変換モードを実行する
   */
  async function executeSingleFileMode(
    inputPath: string,
    quality: number,
    force: boolean,
    output: string | undefined,
    quiet: boolean,
    lossless: boolean,
  ): Promise<number> {
    const result = await converter.convert(inputPath, {
      force,
      lossless,
      output,
      quality,
    });

    reporter.reportConversion(result, quiet);

    return result.error ? 1 : 0;
  }

  /**
   * ディレクトリ変換モードを実行する
   */
  async function executeDirectoryMode(
    inputPath: string,
    quality: number,
    force: boolean,
    output: string | undefined,
    recursive: boolean,
    quiet: boolean,
    lossless: boolean,
  ): Promise<number> {
    const files = await fileScanner.scan(inputPath, {
      extensions: CONVERT_EXTENSIONS,
      recursive,
    });

    // 変換対象ファイルがない場合は警告を表示（Requirement 4.4）
    if (files.length === 0) {
      process.stdout.write('Warning: No convertible files found\n');
      return 0;
    }

    // 進捗コールバック
    const onProgress = (result: ConversionResult, index: number, total: number): void => {
      if (!quiet) {
        reporter.reportProgress(index + 1, total, result.inputPath);
        reporter.reportConversion(result, quiet);
      }
    };

    const stats = await converter.convertBatch(files, { force, lossless, output, quality }, onProgress);

    if (!quiet) {
      reporter.reportStats(stats);
    }

    // エラーがあった場合は終了コード 1 を返す
    return stats.errorCount > 0 ? 1 : 0;
  }

  return {
    async run(argv: string[]): Promise<number> {
      const options = argumentParser.parse(argv);

      // 入力が空の場合は終了（ヘルプは既に表示済み）
      if (!options.input) {
        return 0;
      }

      // 入力パスの存在確認
      const exists = await fileScanner.exists(options.input);
      if (!exists) {
        process.stderr.write(`Error: File not found: ${options.input}\n`);
        return 1;
      }

      // lossless と quality の同時指定時に警告を出す（quality がデフォルト値でない場合）
      if (options.lossless && options.quality !== 100 && !options.quiet) {
        process.stderr.write(
          '警告: --lossless と --quality が同時に指定されています。lossless モードでは quality は無視されます。\n',
        );
      }

      // 一覧表示モード（--list オプション）
      if (options.list) {
        const isDir = await fileScanner.isDirectory(options.input);
        if (!isDir) {
          // 単一ファイルの場合も一覧表示
          const info = await imageInspector.getInfo(options.input);
          const basePath = options.absolutePath ? undefined : path.dirname(path.resolve(options.input));
          reporter.reportImageList(
            [
              {
                height: info.height,
                path: info.path,
                size: info.size,
                width: info.width,
              },
            ],
            basePath,
          );
          return 0;
        }
        return executeListMode(options.input, options.recursive, options.absolutePath);
      }

      // ファイル or ディレクトリの判定
      const isDirectory = await fileScanner.isDirectory(options.input);

      if (isDirectory) {
        // ディレクトリ変換モード
        return executeDirectoryMode(
          options.input,
          options.quality,
          options.force,
          options.output,
          options.recursive,
          options.quiet,
          options.lossless,
        );
      }

      // 単一ファイル変換モード
      return executeSingleFileMode(
        options.input,
        options.quality,
        options.force,
        options.output,
        options.quiet,
        options.lossless,
      );
    },
  };
}
