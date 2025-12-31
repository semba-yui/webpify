import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { ConverterService, FileScannerService, ImageInspectorService } from '../../core/index.js';
import type { ConversionStats, ImageInfo, ParsedOptions } from '../../types/index.js';
import type { ArgumentParserService } from '../argument-parser/index.js';
import type { ReporterService } from '../reporter/index.js';
import { createMain, type MainDependencies, type MainService } from './index.js';

/**
 * main モジュールのテスト
 *
 * タスク 5.1: エントリポイントの実装
 * - 依存性の組み立て
 * - 引数パースと実行モード判定
 * - 変換モードと一覧モードの分岐
 */
describe('main', () => {
  let mockArgumentParser: {
    parse: Mock;
    showHelp: Mock;
    showVersion: Mock;
  };
  let mockReporter: {
    reportConversion: Mock;
    reportProgress: Mock;
    reportStats: Mock;
    reportImageList: Mock;
  };
  let mockConverter: {
    isSupportedFormat: Mock;
    convert: Mock;
    convertBatch: Mock;
  };
  let mockFileScanner: {
    scan: Mock;
    isDirectory: Mock;
    exists: Mock;
  };
  let mockImageInspector: {
    getInfo: Mock;
    getInfoBatch: Mock;
  };
  let main: MainService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockArgumentParser = {
      parse: vi.fn(),
      showHelp: vi.fn(),
      showVersion: vi.fn(),
    };

    mockReporter = {
      reportConversion: vi.fn(),
      reportImageList: vi.fn(),
      reportProgress: vi.fn(),
      reportStats: vi.fn(),
    };

    mockConverter = {
      convert: vi.fn(),
      convertBatch: vi.fn(),
      isSupportedFormat: vi.fn(),
    };

    mockFileScanner = {
      exists: vi.fn(),
      isDirectory: vi.fn(),
      scan: vi.fn(),
    };

    mockImageInspector = {
      getInfo: vi.fn(),
      getInfoBatch: vi.fn(),
    };

    const deps: MainDependencies = {
      argumentParser: mockArgumentParser as unknown as ArgumentParserService,
      converter: mockConverter as unknown as ConverterService,
      fileScanner: mockFileScanner as unknown as FileScannerService,
      imageInspector: mockImageInspector as unknown as ImageInspectorService,
      reporter: mockReporter as unknown as ReporterService,
    };

    main = createMain(deps);
  });

  describe('run', () => {
    /**
     * Given: 空の入力が指定された場合
     * When: run を呼び出す
     * Then: 終了コード 0 を返す（ヘルプ表示後）
     */
    it('should return exit code 0 when input is empty', async () => {
      const options: ParsedOptions = {
        force: false,
        input: '',
        list: false,
        quality: 80,
        quiet: false,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);

      const exitCode = await main.run(['node', 'webpify']);

      expect(exitCode).toBe(0);
    });

    /**
     * Given: --list オプションが指定された場合
     * When: run を呼び出す
     * Then: 一覧表示モードで実行する
     */
    it('should execute list mode when --list option is specified', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './images',
        list: true,
        quality: 80,
        quiet: false,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(true);
      mockFileScanner.isDirectory.mockResolvedValue(true);
      mockFileScanner.scan.mockResolvedValue(['image1.webp', 'image2.webp']);

      const imageInfos: ImageInfo[] = [
        { format: 'webp', height: 600, path: 'image1.webp', size: 1024, width: 800 },
        { format: 'webp', height: 768, path: 'image2.webp', size: 2048, width: 1024 },
      ];
      mockImageInspector.getInfoBatch.mockResolvedValue(imageInfos);

      const exitCode = await main.run(['node', 'webpify', '--list', './images']);

      expect(exitCode).toBe(0);
      expect(mockFileScanner.scan).toHaveBeenCalledWith('./images', {
        extensions: ['webp'],
        recursive: false,
      });
      expect(mockReporter.reportImageList).toHaveBeenCalled();
    });

    /**
     * Given: ファイルパスが指定された場合
     * When: run を呼び出す
     * Then: 単一ファイル変換モードで実行する
     */
    it('should execute single file conversion mode when file path is specified', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './image.png',
        list: false,
        quality: 80,
        quiet: false,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(true);
      mockFileScanner.isDirectory.mockResolvedValue(false);
      mockConverter.convert.mockResolvedValue({
        inputPath: './image.png',
        inputSize: 2048,
        outputPath: './image.webp',
        outputSize: 1024,
        skipped: false,
      });

      const exitCode = await main.run(['node', 'webpify', './image.png']);

      expect(exitCode).toBe(0);
      expect(mockConverter.convert).toHaveBeenCalledWith('./image.png', {
        force: false,
        output: undefined,
        quality: 80,
      });
      expect(mockReporter.reportConversion).toHaveBeenCalled();
    });

    /**
     * Given: ディレクトリパスが指定された場合
     * When: run を呼び出す
     * Then: ディレクトリ変換モードで実行する
     */
    it('should execute directory conversion mode when directory path is specified', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './images',
        list: false,
        quality: 80,
        quiet: false,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(true);
      mockFileScanner.isDirectory.mockResolvedValue(true);
      mockFileScanner.scan.mockResolvedValue(['./images/a.png', './images/b.jpg']);

      const stats: ConversionStats = {
        errorCount: 0,
        skippedCount: 0,
        successCount: 2,
        totalFiles: 2,
        totalInputSize: 4096,
        totalOutputSize: 2048,
      };
      mockConverter.convertBatch.mockResolvedValue(stats);

      const exitCode = await main.run(['node', 'webpify', './images']);

      expect(exitCode).toBe(0);
      expect(mockFileScanner.scan).toHaveBeenCalledWith('./images', {
        extensions: ['png', 'jpeg', 'jpg', 'gif'],
        recursive: false,
      });
      expect(mockConverter.convertBatch).toHaveBeenCalled();
      expect(mockReporter.reportStats).toHaveBeenCalledWith(stats);
    });

    /**
     * Given: 入力パスが存在しない場合
     * When: run を呼び出す
     * Then: 終了コード 1 を返す
     */
    it('should return exit code 1 when input path does not exist', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './nonexistent',
        list: false,
        quality: 80,
        quiet: false,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(false);

      // stderr を一時的にキャプチャ
      const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      const exitCode = await main.run(['node', 'webpify', './nonexistent']);

      expect(exitCode).toBe(1);
      expect(stderrWrite).toHaveBeenCalled();

      stderrWrite.mockRestore();
    });

    /**
     * Given: 変換でエラーが発生した場合
     * When: run を呼び出す
     * Then: 終了コード 1 を返す
     */
    it('should return exit code 1 when conversion has errors', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './image.png',
        list: false,
        quality: 80,
        quiet: false,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(true);
      mockFileScanner.isDirectory.mockResolvedValue(false);
      mockConverter.convert.mockResolvedValue({
        error: 'Image processing failed',
        inputPath: './image.png',
        inputSize: 0,
        outputPath: './image.webp',
        outputSize: 0,
        skipped: false,
      });

      const exitCode = await main.run(['node', 'webpify', './image.png']);

      expect(exitCode).toBe(1);
    });

    /**
     * Given: ディレクトリに変換対象ファイルがない場合
     * When: run を呼び出す
     * Then: 警告を表示して終了コード 0 を返す
     */
    it('should return exit code 0 with warning when no files to convert', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './images',
        list: false,
        quality: 80,
        quiet: false,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(true);
      mockFileScanner.isDirectory.mockResolvedValue(true);
      mockFileScanner.scan.mockResolvedValue([]);

      const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

      const exitCode = await main.run(['node', 'webpify', './images']);

      expect(exitCode).toBe(0);
      expect(stdoutWrite).toHaveBeenCalledWith(expect.stringContaining('Warning'));

      stdoutWrite.mockRestore();
    });

    /**
     * Given: --recursive オプションが指定された場合
     * When: ディレクトリを変換する
     * Then: 再帰的にファイルをスキャンする
     */
    it('should scan recursively when --recursive option is specified', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './images',
        list: false,
        quality: 80,
        quiet: false,
        recursive: true,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(true);
      mockFileScanner.isDirectory.mockResolvedValue(true);
      mockFileScanner.scan.mockResolvedValue(['./images/a.png']);

      const stats: ConversionStats = {
        errorCount: 0,
        skippedCount: 0,
        successCount: 1,
        totalFiles: 1,
        totalInputSize: 2048,
        totalOutputSize: 1024,
      };
      mockConverter.convertBatch.mockResolvedValue(stats);

      await main.run(['node', 'webpify', './images', '-r']);

      expect(mockFileScanner.scan).toHaveBeenCalledWith('./images', {
        extensions: ['png', 'jpeg', 'jpg', 'gif'],
        recursive: true,
      });
    });

    /**
     * Given: --quiet オプションが指定された場合
     * When: 変換を実行する
     * Then: サイレントモードで実行する
     */
    it('should pass quiet option to reporter', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './image.png',
        list: false,
        quality: 80,
        quiet: true,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(true);
      mockFileScanner.isDirectory.mockResolvedValue(false);
      mockConverter.convert.mockResolvedValue({
        inputPath: './image.png',
        inputSize: 2048,
        outputPath: './image.webp',
        outputSize: 1024,
        skipped: false,
      });

      await main.run(['node', 'webpify', './image.png', '--quiet']);

      expect(mockReporter.reportConversion).toHaveBeenCalledWith(expect.any(Object), true);
    });

    /**
     * Given: --list オプションが単一ファイルに対して指定された場合
     * When: run を呼び出す
     * Then: 単一ファイルの情報を一覧表示する
     */
    it('should display single file info when --list option is specified for a file', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './image.webp',
        list: true,
        quality: 80,
        quiet: false,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(true);
      mockFileScanner.isDirectory.mockResolvedValue(false);

      const imageInfo: ImageInfo = {
        format: 'webp',
        height: 600,
        path: './image.webp',
        size: 1024,
        width: 800,
      };
      mockImageInspector.getInfo.mockResolvedValue(imageInfo);

      const exitCode = await main.run(['node', 'webpify', '--list', './image.webp']);

      expect(exitCode).toBe(0);
      expect(mockImageInspector.getInfo).toHaveBeenCalledWith('./image.webp');
      expect(mockReporter.reportImageList).toHaveBeenCalledWith([
        {
          height: 600,
          path: './image.webp',
          size: 1024,
          width: 800,
        },
      ]);
    });

    /**
     * Given: ディレクトリ変換で進捗コールバックが呼ばれる場合
     * When: run を呼び出す
     * Then: 進捗表示が行われる
     */
    it('should call progress callback during directory conversion', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './images',
        list: false,
        quality: 80,
        quiet: false,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(true);
      mockFileScanner.isDirectory.mockResolvedValue(true);
      mockFileScanner.scan.mockResolvedValue(['./images/a.png', './images/b.jpg']);

      const stats: ConversionStats = {
        errorCount: 0,
        skippedCount: 0,
        successCount: 2,
        totalFiles: 2,
        totalInputSize: 4096,
        totalOutputSize: 2048,
      };

      // convertBatch がコールバックを呼び出すようにモック
      mockConverter.convertBatch.mockImplementation(
        async (
          _paths: string[],
          _options: unknown,
          onProgress?: (result: { inputPath: string }, index: number, total: number) => void,
        ) => {
          if (onProgress) {
            onProgress({ inputPath: './images/a.png' }, 0, 2);
            onProgress({ inputPath: './images/b.jpg' }, 1, 2);
          }
          return stats;
        },
      );

      const exitCode = await main.run(['node', 'webpify', './images']);

      expect(exitCode).toBe(0);
      expect(mockReporter.reportProgress).toHaveBeenCalledTimes(2);
      expect(mockReporter.reportProgress).toHaveBeenNthCalledWith(1, 1, 2, './images/a.png');
      expect(mockReporter.reportProgress).toHaveBeenNthCalledWith(2, 2, 2, './images/b.jpg');
      expect(mockReporter.reportConversion).toHaveBeenCalledTimes(2);
    });

    /**
     * Given: ディレクトリ変換で quiet オプションが指定された場合
     * When: run を呼び出す
     * Then: 進捗表示とレポートが抑制される
     */
    it('should suppress progress and stats in quiet mode for directory conversion', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './images',
        list: false,
        quality: 80,
        quiet: true,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(true);
      mockFileScanner.isDirectory.mockResolvedValue(true);
      mockFileScanner.scan.mockResolvedValue(['./images/a.png']);

      const stats: ConversionStats = {
        errorCount: 0,
        skippedCount: 0,
        successCount: 1,
        totalFiles: 1,
        totalInputSize: 2048,
        totalOutputSize: 1024,
      };

      // convertBatch がコールバックを呼び出すようにモック
      mockConverter.convertBatch.mockImplementation(
        async (
          _paths: string[],
          _options: unknown,
          onProgress?: (result: { inputPath: string }, index: number, total: number) => void,
        ) => {
          if (onProgress) {
            onProgress({ inputPath: './images/a.png' }, 0, 1);
          }
          return stats;
        },
      );

      const exitCode = await main.run(['node', 'webpify', './images', '--quiet']);

      expect(exitCode).toBe(0);
      // quiet モードでは進捗表示とレポートが抑制される
      expect(mockReporter.reportProgress).not.toHaveBeenCalled();
      expect(mockReporter.reportConversion).not.toHaveBeenCalled();
      expect(mockReporter.reportStats).not.toHaveBeenCalled();
    });

    /**
     * Given: ディレクトリ変換でエラーが発生した場合
     * When: run を呼び出す
     * Then: 終了コード 1 を返す
     */
    it('should return exit code 1 when directory conversion has errors', async () => {
      const options: ParsedOptions = {
        force: false,
        input: './images',
        list: false,
        quality: 80,
        quiet: false,
        recursive: false,
      };
      mockArgumentParser.parse.mockReturnValue(options);
      mockFileScanner.exists.mockResolvedValue(true);
      mockFileScanner.isDirectory.mockResolvedValue(true);
      mockFileScanner.scan.mockResolvedValue(['./images/a.png']);

      const stats: ConversionStats = {
        errorCount: 1,
        skippedCount: 0,
        successCount: 0,
        totalFiles: 1,
        totalInputSize: 0,
        totalOutputSize: 0,
      };
      mockConverter.convertBatch.mockResolvedValue(stats);

      const exitCode = await main.run(['node', 'webpify', './images']);

      expect(exitCode).toBe(1);
    });
  });
});
