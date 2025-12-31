import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConversionResult, ConversionStats, ImageListItem } from '../../types/index.js';
import { createReporter, type ReporterService } from './index.js';

describe('Reporter', () => {
  let reporter: ReporterService;
  let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reporter = createReporter();
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutWriteSpy.mockRestore();
  });

  // =================================================================
  // reportConversion のテスト - 単一ファイル変換結果の表示
  // Requirements: 7.1
  // =================================================================
  describe('reportConversion', () => {
    // Given: 変換が成功した結果がある場合
    // When: reportConversion を呼び出す
    // Then: 元のファイルサイズと変換後のファイルサイズが表示される
    it('should display input and output file sizes for successful conversion', () => {
      const result: ConversionResult = {
        inputPath: '/path/to/image.png',
        inputSize: 10240,
        outputPath: '/path/to/image.webp',
        outputSize: 5120,
        skipped: false,
      };

      reporter.reportConversion(result, false);

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('image.png');
      expect(output).toContain('10.00 KB');
      expect(output).toContain('5.00 KB');
      expect(output).toContain('50.0%');
    });

    // Given: ファイルがスキップされた結果がある場合
    // When: reportConversion を呼び出す
    // Then: スキップされたことが表示される
    it('should display skip message when file is skipped', () => {
      const result: ConversionResult = {
        inputPath: '/path/to/image.png',
        inputSize: 10240,
        outputPath: '/path/to/image.webp',
        outputSize: 0,
        skipped: true,
      };

      reporter.reportConversion(result, false);

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('Skipped');
      expect(output).toContain('image.png');
    });

    // Given: quiet モードが有効な場合
    // When: reportConversion を呼び出す
    // Then: 何も出力されない
    it('should not output anything in quiet mode', () => {
      const result: ConversionResult = {
        inputPath: '/path/to/image.png',
        inputSize: 10240,
        outputPath: '/path/to/image.webp',
        outputSize: 5120,
        skipped: false,
      };

      reporter.reportConversion(result, true);

      expect(stdoutWriteSpy).not.toHaveBeenCalled();
    });

    // Given: エラーが発生した結果がある場合
    // When: reportConversion を呼び出す
    // Then: エラーメッセージが表示される
    it('should display error message when conversion failed', () => {
      const result: ConversionResult = {
        error: 'File not found',
        inputPath: '/path/to/image.png',
        inputSize: 0,
        outputPath: '/path/to/image.webp',
        outputSize: 0,
        skipped: false,
      };

      reporter.reportConversion(result, false);

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('Error');
      expect(output).toContain('image.png');
      expect(output).toContain('File not found');
    });

    // Given: サイズが増加した結果がある場合
    // When: reportConversion を呼び出す
    // Then: サイズ増加が表示される
    it('should display size increase when output is larger than input', () => {
      const result: ConversionResult = {
        inputPath: '/path/to/image.png',
        inputSize: 5120,
        outputPath: '/path/to/image.webp',
        outputSize: 10240,
        skipped: false,
      };

      reporter.reportConversion(result, false);

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('+100.0%');
    });

    // Given: 入力サイズが 0 の結果がある場合
    // When: reportConversion を呼び出す
    // Then: 0.0% として表示される
    it('should display 0.0% when input size is 0', () => {
      const result: ConversionResult = {
        inputPath: '/path/to/empty.png',
        inputSize: 0,
        outputPath: '/path/to/empty.webp',
        outputSize: 0,
        skipped: false,
      };

      reporter.reportConversion(result, false);

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('0.0%');
    });
  });

  // =================================================================
  // reportProgress のテスト - 進捗表示
  // Requirements: 4.3
  // =================================================================
  describe('reportProgress', () => {
    // Given: 処理中のファイルがある場合
    // When: reportProgress を呼び出す
    // Then: ファイル名と進捗が表示される
    it('should display file name and progress', () => {
      reporter.reportProgress(3, 10, 'image.png');

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('[3/10]');
      expect(output).toContain('image.png');
    });
  });

  // =================================================================
  // reportStats のテスト - 統計サマリーの表示
  // Requirements: 7.2
  // =================================================================
  describe('reportStats', () => {
    // Given: 複数ファイルの変換結果がある場合
    // When: reportStats を呼び出す
    // Then: 処理したファイル数、成功数、スキップ数、合計サイズ削減量が表示される
    it('should display all statistics for batch conversion', () => {
      const stats: ConversionStats = {
        errorCount: 1,
        skippedCount: 1,
        successCount: 8,
        totalFiles: 10,
        totalInputSize: 102400,
        totalOutputSize: 51200,
      };

      reporter.reportStats(stats);

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('10');
      expect(output).toContain('8');
      expect(output).toContain('1');
      expect(output).toContain('50.0%');
    });

    // Given: 変換成功ファイルがない場合
    // When: reportStats を呼び出す
    // Then: 削減量は表示されない（または0%として表示）
    it('should handle zero success count gracefully', () => {
      const stats: ConversionStats = {
        errorCount: 2,
        skippedCount: 3,
        successCount: 0,
        totalFiles: 5,
        totalInputSize: 0,
        totalOutputSize: 0,
      };

      reporter.reportStats(stats);

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('5');
      expect(output).toContain('0');
    });
  });

  // =================================================================
  // reportImageList のテスト - WebP 一覧表示
  // Requirements: 8.1, 8.4
  // =================================================================
  describe('reportImageList', () => {
    // Given: WebP ファイルのリストがある場合
    // When: reportImageList を呼び出す
    // Then: ファイル名、サイズ、幅、高さが表示される
    it('should display file name, size, width, and height for each item', () => {
      const items: ImageListItem[] = [
        { height: 600, path: '/path/to/image1.webp', size: 10240, width: 800 },
        { height: 1080, path: '/path/to/image2.webp', size: 5120, width: 1920 },
      ];

      reporter.reportImageList(items);

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('image1.webp');
      expect(output).toContain('10.00 KB');
      expect(output).toContain('800');
      expect(output).toContain('600');
      expect(output).toContain('image2.webp');
      expect(output).toContain('5.00 KB');
      expect(output).toContain('1920');
      expect(output).toContain('1080');
    });

    // Given: リストが空の場合
    // When: reportImageList を呼び出す
    // Then: ファイルが見つからないメッセージが表示される
    it('should display not found message when list is empty', () => {
      reporter.reportImageList([]);

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('WebP ファイルが見つかりません');
    });

    // Given: サイズが MB 単位のファイルがある場合
    // When: reportImageList を呼び出す
    // Then: MB 単位で表示される
    it('should display size in MB for large files', () => {
      const items: ImageListItem[] = [{ height: 3000, path: '/path/to/large.webp', size: 5242880, width: 4000 }];

      reporter.reportImageList(items);

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('5.00 MB');
    });

    // Given: サイズが小さいファイルがある場合
    // When: reportImageList を呼び出す
    // Then: バイト単位で表示される
    it('should display size in bytes for small files', () => {
      const items: ImageListItem[] = [{ height: 16, path: '/path/to/tiny.webp', size: 512, width: 16 }];

      reporter.reportImageList(items);

      const output = stdoutWriteSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain('512 B');
    });
  });
});
