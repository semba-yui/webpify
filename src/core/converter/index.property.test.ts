/**
 * Converter のプロパティベースドテスト
 *
 * プロパティベースドテストは、ランダムなテストデータを自動生成して
 * 不変条件（プロパティ）が常に満たされることを検証する。
 */
import { fc, test } from '@fast-check/vitest';
import { describe, expect, vi } from 'vitest';
import type { FileSystemPort } from '../../ports/file-system.js';
import type { ImageProcessorPort } from '../../ports/image-processor.js';
import { createConverter } from './index.js';

describe('Converter - Property Based Tests', () => {
  describe('convertBatch 統計集計の不変条件', () => {
    /**
     * プロパティ: totalFiles = successCount + skippedCount + errorCount
     *
     * 不変条件: 処理結果のカウントの合計は常に入力ファイル数と一致する
     */

    // 変換結果パターンの Arbitrary
    const conversionPatternArb = fc.record({
      inputSize: fc.integer({ max: 10_000_000, min: 100 }),
      outputSize: fc.integer({ max: 5_000_000, min: 50 }),
      type: fc.constantFrom('success', 'skipped', 'error'),
    });

    test.prop([fc.array(conversionPatternArb, { maxLength: 50, minLength: 0 })])(
      'Given 任意の変換結果パターン When convertBatch を実行 Then totalFiles = successCount + skippedCount + errorCount',
      async (patterns) => {
        // Given: パターンに基づいてモックを設定
        let callIndex = 0;

        const mockFileSystem: FileSystemPort = {
          exists: vi.fn().mockImplementation(async (filePath: string) => {
            const pattern = patterns[callIndex];
            if (!pattern) return false;

            // 出力ファイルパスの場合（.webp で終わる）
            if (filePath.endsWith('.webp')) {
              return pattern.type === 'skipped';
            }
            // 入力ファイルパスの場合
            return pattern.type !== 'error';
          }),
          isDirectory: vi.fn().mockResolvedValue(false),
          mkdir: vi.fn().mockResolvedValue(undefined),
          readDir: vi.fn().mockResolvedValue([]),
          readDirRecursive: vi.fn().mockResolvedValue([]),
          stat: vi.fn().mockImplementation(async () => {
            const pattern = patterns[callIndex];
            return { size: pattern?.inputSize ?? 0 };
          }),
        };

        const mockImageProcessor: ImageProcessorPort = {
          convertToWebP: vi.fn().mockImplementation(async () => {
            const pattern = patterns[callIndex];
            callIndex++;
            if (pattern?.type === 'error') {
              throw new Error('Simulated conversion error');
            }
            return { size: pattern?.outputSize ?? 0 };
          }),
          getMetadata: vi.fn().mockResolvedValue({ format: 'png', height: 100, width: 100 }),
        };

        const converter = createConverter({
          fileSystem: mockFileSystem,
          imageProcessor: mockImageProcessor,
        });

        const inputPaths = patterns.map((_, i) => `/images/photo${i}.png`);

        // When
        const stats = await converter.convertBatch(inputPaths, { force: false, quality: 80 });

        // Then: 不変条件の検証
        expect(stats.totalFiles).toBe(stats.successCount + stats.skippedCount + stats.errorCount);
        expect(stats.totalFiles).toBe(patterns.length);
      },
    );

    /**
     * プロパティ: 成功ケースのみの場合、サイズ合計が正確
     *
     * 不変条件: すべての変換が成功した場合、サイズ合計は各ファイルサイズの合計と一致する
     */
    test.prop([
      fc.array(
        fc.record({
          inputSize: fc.integer({ max: 1_000_000, min: 100 }),
          outputSize: fc.integer({ max: 500_000, min: 50 }),
        }),
        { maxLength: 20, minLength: 1 },
      ),
    ])('Given 成功する変換のみ When convertBatch を実行 Then サイズ合計が正確', async (sizePatterns) => {
      // Given
      let callIndex = 0;

      const mockFileSystem: FileSystemPort = {
        exists: vi.fn().mockImplementation(async (filePath: string) => {
          // 出力ファイルは存在しない（スキップしない）
          return !filePath.endsWith('.webp');
        }),
        isDirectory: vi.fn().mockResolvedValue(false),
        mkdir: vi.fn().mockResolvedValue(undefined),
        readDir: vi.fn().mockResolvedValue([]),
        readDirRecursive: vi.fn().mockResolvedValue([]),
        stat: vi.fn().mockImplementation(async () => {
          return { size: sizePatterns[callIndex]?.inputSize ?? 0 };
        }),
      };

      const mockImageProcessor: ImageProcessorPort = {
        convertToWebP: vi.fn().mockImplementation(async () => {
          const size = sizePatterns[callIndex]?.outputSize ?? 0;
          callIndex++;
          return { size };
        }),
        getMetadata: vi.fn().mockResolvedValue({ format: 'png', height: 100, width: 100 }),
      };

      const converter = createConverter({
        fileSystem: mockFileSystem,
        imageProcessor: mockImageProcessor,
      });

      const inputPaths = sizePatterns.map((_, i) => `/images/photo${i}.png`);
      const expectedInputTotal = sizePatterns.reduce((sum, p) => sum + p.inputSize, 0);
      const expectedOutputTotal = sizePatterns.reduce((sum, p) => sum + p.outputSize, 0);

      // When
      const stats = await converter.convertBatch(inputPaths, { force: false, quality: 80 });

      // Then
      expect(stats.totalInputSize).toBe(expectedInputTotal);
      expect(stats.totalOutputSize).toBe(expectedOutputTotal);
      expect(stats.successCount).toBe(sizePatterns.length);
      expect(stats.errorCount).toBe(0);
      expect(stats.skippedCount).toBe(0);
    });

    /**
     * プロパティ: スキップされたファイルの出力サイズは 0
     *
     * 不変条件: スキップされたファイルは出力サイズに加算されない
     */
    test.prop([
      fc.array(
        fc.record({
          inputSize: fc.integer({ max: 1_000_000, min: 100 }),
        }),
        { maxLength: 20, minLength: 1 },
      ),
    ])('Given すべてスキップされる場合 When convertBatch を実行 Then 出力サイズは 0', async (patterns) => {
      // Given: すべてのファイルが既に存在する（スキップされる）
      let callIndex = 0;

      const mockFileSystem: FileSystemPort = {
        exists: vi.fn().mockResolvedValue(true), // 入力も出力も存在
        isDirectory: vi.fn().mockResolvedValue(false),
        mkdir: vi.fn().mockResolvedValue(undefined),
        readDir: vi.fn().mockResolvedValue([]),
        readDirRecursive: vi.fn().mockResolvedValue([]),
        stat: vi.fn().mockImplementation(async () => {
          const size = patterns[callIndex]?.inputSize ?? 0;
          callIndex++;
          return { size };
        }),
      };

      const mockImageProcessor: ImageProcessorPort = {
        convertToWebP: vi.fn().mockResolvedValue({ size: 0 }),
        getMetadata: vi.fn().mockResolvedValue({ format: 'png', height: 100, width: 100 }),
      };

      const converter = createConverter({
        fileSystem: mockFileSystem,
        imageProcessor: mockImageProcessor,
      });

      const inputPaths = patterns.map((_, i) => `/images/photo${i}.png`);

      // When
      const stats = await converter.convertBatch(inputPaths, { force: false, quality: 80 });

      // Then
      expect(stats.totalOutputSize).toBe(0);
      expect(stats.skippedCount).toBe(patterns.length);
      expect(stats.successCount).toBe(0);
      expect(stats.errorCount).toBe(0);
    });
  });

  describe('isSupportedFormat の不変条件', () => {
    /**
     * プロパティ: サポート拡張子は常に true を返す
     */
    test.prop([fc.constantFrom('png', 'jpg', 'jpeg', 'gif'), fc.stringMatching(/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/)])(
      'Given サポートされる拡張子 When isSupportedFormat を呼び出す Then true を返す',
      (ext, filename) => {
        // Given
        const converter = createConverter({
          fileSystem: {} as FileSystemPort,
          imageProcessor: {} as ImageProcessorPort,
        });
        const filePath = `/path/to/${filename}.${ext}`;

        // When
        const result = converter.isSupportedFormat(filePath);

        // Then
        expect(result).toBe(true);
      },
    );

    /**
     * プロパティ: 非サポート拡張子は常に false を返す
     */
    test.prop([
      fc.constantFrom('webp', 'bmp', 'tiff', 'svg', 'ico', 'pdf', 'txt'),
      fc.stringMatching(/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/),
    ])('Given サポートされない拡張子 When isSupportedFormat を呼び出す Then false を返す', (ext, filename) => {
      // Given
      const converter = createConverter({
        fileSystem: {} as FileSystemPort,
        imageProcessor: {} as ImageProcessorPort,
      });
      const filePath = `/path/to/${filename}.${ext}`;

      // When
      const result = converter.isSupportedFormat(filePath);

      // Then
      expect(result).toBe(false);
    });

    /**
     * プロパティ: 拡張子の大文字小文字は区別しない
     */
    test.prop([fc.constantFrom('PNG', 'Png', 'pNg', 'JPG', 'Jpeg', 'GIF', 'Gif')])(
      'Given 大文字混在の拡張子 When isSupportedFormat を呼び出す Then true を返す',
      (ext) => {
        // Given
        const converter = createConverter({
          fileSystem: {} as FileSystemPort,
          imageProcessor: {} as ImageProcessorPort,
        });
        const filePath = `/path/to/image.${ext}`;

        // When
        const result = converter.isSupportedFormat(filePath);

        // Then
        expect(result).toBe(true);
      },
    );
  });

  describe('品質値の効果', () => {
    /**
     * プロパティ: 品質値は変換結果に影響する（エラーなく処理される）
     */
    test.prop([fc.integer({ max: 100, min: 1 })])(
      'Given 有効な品質値（1-100）When convert を実行 Then エラーなく処理される',
      async (quality) => {
        // Given
        const mockFileSystem: FileSystemPort = {
          exists: vi.fn().mockImplementation(async (p: string) => !p.endsWith('.webp')),
          isDirectory: vi.fn().mockResolvedValue(false),
          mkdir: vi.fn().mockResolvedValue(undefined),
          readDir: vi.fn().mockResolvedValue([]),
          readDirRecursive: vi.fn().mockResolvedValue([]),
          stat: vi.fn().mockResolvedValue({ size: 1000 }),
        };

        const mockImageProcessor: ImageProcessorPort = {
          convertToWebP: vi.fn().mockResolvedValue({ size: 500 }),
          getMetadata: vi.fn().mockResolvedValue({ format: 'png', height: 100, width: 100 }),
        };

        const converter = createConverter({
          fileSystem: mockFileSystem,
          imageProcessor: mockImageProcessor,
        });

        // When
        const result = await converter.convert('/images/photo.png', { force: false, quality });

        // Then
        expect(result.error).toBeUndefined();
        expect(result.skipped).toBe(false);
        expect(mockImageProcessor.convertToWebP).toHaveBeenCalledWith('/images/photo.png', expect.any(String), {
          quality,
        });
      },
    );
  });
});
