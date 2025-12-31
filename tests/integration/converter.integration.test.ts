/**
 * Converter の統合テスト
 * 実際の sharp/fs を使用して画像変換機能をテストする
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createFsAdapter } from '../../src/adapters/fs-adapter/index.js';
import { createSharpAdapter } from '../../src/adapters/sharp-adapter/index.js';
import { createConverter } from '../../src/core/converter/index.js';

describe('Converter Integration', () => {
  const fixturesDir = path.join(import.meta.dirname, '../fixtures');
  const outputDir = path.join(import.meta.dirname, '../output');
  let converter: ReturnType<typeof createConverter>;

  beforeAll(async () => {
    // Given: テスト用の Converter を生成し、出力ディレクトリを作成
    converter = createConverter({
      fileSystem: createFsAdapter(),
      imageProcessor: createSharpAdapter(),
    });
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    // 出力ディレクトリをクリーンアップ
    await fs.rm(outputDir, { force: true, recursive: true });
  });

  describe('単一ファイル変換', () => {
    // PNG ファイルを WebP に変換できることをテスト
    it('PNG ファイルを WebP に変換できる', async () => {
      // Given: PNG 画像ファイル
      const inputPath = path.join(fixturesDir, 'sample.png');

      // When: WebP に変換
      const result = await converter.convert(inputPath, {
        force: true,
        output: outputDir,
        quality: 80,
      });

      // Then: 変換が成功し、出力ファイルが存在する
      expect(result.skipped).toBe(false);
      expect(result.error).toBeUndefined();
      expect(result.outputSize).toBeGreaterThan(0);

      const outputExists = await fs
        .stat(result.outputPath)
        .then(() => true)
        .catch(() => false);
      expect(outputExists).toBe(true);
    });

    // JPEG ファイルを WebP に変換できることをテスト
    it('JPEG ファイルを WebP に変換できる', async () => {
      // Given: JPEG 画像ファイル
      const inputPath = path.join(fixturesDir, 'sample.jpg');

      // When: WebP に変換
      const result = await converter.convert(inputPath, {
        force: true,
        output: outputDir,
        quality: 80,
      });

      // Then: 変換が成功
      expect(result.skipped).toBe(false);
      expect(result.error).toBeUndefined();
      expect(result.outputSize).toBeGreaterThan(0);
    });

    // GIF ファイルを WebP に変換できることをテスト
    it('GIF ファイルを WebP に変換できる', async () => {
      // Given: GIF 画像ファイル
      const inputPath = path.join(fixturesDir, 'sample.gif');

      // When: WebP に変換
      const result = await converter.convert(inputPath, {
        force: true,
        output: outputDir,
        quality: 80,
      });

      // Then: 変換が成功
      expect(result.skipped).toBe(false);
      expect(result.error).toBeUndefined();
      expect(result.outputSize).toBeGreaterThan(0);
    });
  });

  describe('上書き制御', () => {
    // 既存ファイルをスキップすることをテスト
    it('force: false の場合、既存ファイルをスキップする', async () => {
      // Given: 既に変換済みのファイル
      const inputPath = path.join(fixturesDir, 'sample.png');

      // まず変換を実行して出力ファイルを作成
      await converter.convert(inputPath, {
        force: true,
        output: outputDir,
        quality: 80,
      });

      // When: force: false で再度変換を試行
      const result = await converter.convert(inputPath, {
        force: false,
        output: outputDir,
        quality: 80,
      });

      // Then: スキップされる
      expect(result.skipped).toBe(true);
      expect(result.error).toBeUndefined();
    });

    // force: true で既存ファイルを上書きすることをテスト
    it('force: true の場合、既存ファイルを上書きする', async () => {
      // Given: 既に変換済みのファイル
      const inputPath = path.join(fixturesDir, 'sample.png');

      // まず変換を実行
      await converter.convert(inputPath, {
        force: true,
        output: outputDir,
        quality: 80,
      });

      // When: force: true で再度変換
      const result = await converter.convert(inputPath, {
        force: true,
        output: outputDir,
        quality: 80,
      });

      // Then: 上書きされて変換が成功
      expect(result.skipped).toBe(false);
      expect(result.error).toBeUndefined();
    });
  });

  describe('品質設定', () => {
    // 低品質と高品質でファイルサイズが異なることをテスト
    it('品質パラメータがファイルサイズに影響する', async () => {
      // Given: 同じ入力ファイル
      const inputPath = path.join(fixturesDir, 'sample.png');

      // 出力ディレクトリを作成
      const highQualityOutputDir = path.join(outputDir, 'high');
      const lowQualityOutputDir = path.join(outputDir, 'low');
      await fs.mkdir(highQualityOutputDir, { recursive: true });
      await fs.mkdir(lowQualityOutputDir, { recursive: true });

      // When: 異なる品質で変換
      const highQuality = await converter.convert(inputPath, {
        force: true,
        output: highQualityOutputDir,
        quality: 100,
      });

      const lowQuality = await converter.convert(inputPath, {
        force: true,
        output: lowQualityOutputDir,
        quality: 10,
      });

      // Then: 両方とも変換が成功し、サイズ情報が取得できる
      expect(highQuality.error).toBeUndefined();
      expect(lowQuality.error).toBeUndefined();
      expect(highQuality.outputSize).toBeGreaterThan(0);
      expect(lowQuality.outputSize).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング', () => {
    // 存在しないファイルでエラーが返ることをテスト
    it('存在しないファイルでエラーを返す', async () => {
      // Given: 存在しないファイルパス
      const inputPath = path.join(fixturesDir, 'nonexistent.png');

      // When: 変換を試行
      const result = await converter.convert(inputPath, {
        force: false,
        quality: 80,
      });

      // Then: エラーが返される
      expect(result.error).toContain('File not found');
    });

    // サポート外フォーマットでエラーが返ることをテスト
    it('サポート外フォーマットでエラーを返す', async () => {
      // Given: テキストファイルを作成
      const txtPath = path.join(outputDir, 'test.txt');
      await fs.writeFile(txtPath, 'test content');

      // When: 変換を試行
      const result = await converter.convert(txtPath, {
        force: false,
        quality: 80,
      });

      // Then: エラーが返される
      expect(result.error).toContain('Unsupported format');
    });
  });

  describe('バッチ変換', () => {
    // 複数ファイルを一括変換できることをテスト
    it('複数ファイルを一括変換して統計情報を返す', async () => {
      // Given: 複数の画像ファイル
      const inputPaths = [
        path.join(fixturesDir, 'sample.png'),
        path.join(fixturesDir, 'sample.jpg'),
        path.join(fixturesDir, 'sample.gif'),
      ];
      const batchOutputDir = path.join(outputDir, 'batch');
      await fs.mkdir(batchOutputDir, { recursive: true });

      // When: バッチ変換を実行
      const stats = await converter.convertBatch(inputPaths, {
        force: true,
        output: batchOutputDir,
        quality: 80,
      });

      // Then: 統計情報が正しい
      expect(stats.totalFiles).toBe(3);
      expect(stats.successCount).toBe(3);
      expect(stats.skippedCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.totalInputSize).toBeGreaterThan(0);
      expect(stats.totalOutputSize).toBeGreaterThan(0);
    });

    // 進捗コールバックが呼び出されることをテスト
    it('進捗コールバックが各ファイルの変換後に呼び出される', async () => {
      // Given: 複数の画像ファイルとコールバック
      const inputPaths = [path.join(fixturesDir, 'sample.png'), path.join(fixturesDir, 'sample.jpg')];
      const callbackOutputDir = path.join(outputDir, 'callback');
      await fs.mkdir(callbackOutputDir, { recursive: true });
      const progressCalls: { index: number; total: number }[] = [];

      // When: コールバック付きでバッチ変換を実行
      await converter.convertBatch(
        inputPaths,
        {
          force: true,
          output: callbackOutputDir,
          quality: 80,
        },
        (_result, index, total) => {
          progressCalls.push({ index, total });
        },
      );

      // Then: コールバックが正しく呼び出される
      expect(progressCalls).toHaveLength(2);
      expect(progressCalls[0]).toEqual({ index: 0, total: 2 });
      expect(progressCalls[1]).toEqual({ index: 1, total: 2 });
    });
  });
});
