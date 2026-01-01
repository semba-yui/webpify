import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ImageProcessorPort } from '../../ports/image-processor.js';
import { createSharpAdapter } from './index.js';

/**
 * sharp アダプターの統合テスト
 * 実際の sharp ライブラリを使用して画像処理機能をテストする
 */
describe('SharpAdapter', () => {
  let adapter: ImageProcessorPort;
  const fixturesDir = path.join(import.meta.dirname, '../../../tests/fixtures');
  const outputDir = path.join(import.meta.dirname, '../../../tests/output-sharp-adapter');

  beforeAll(async () => {
    adapter = createSharpAdapter();
    // 出力ディレクトリを作成
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    // 出力ディレクトリをクリーンアップ
    await fs.rm(outputDir, { force: true, recursive: true });
  });

  describe('convertToWebP', () => {
    // PNG ファイルを WebP に変換できることをテスト
    it('PNG ファイルを WebP 形式に変換できる', async () => {
      // Given: PNG 画像ファイル
      const inputPath = path.join(fixturesDir, 'sample.png');
      const outputPath = path.join(outputDir, 'sample-from-png.webp');

      // When: WebP に変換
      const result = await adapter.convertToWebP(inputPath, outputPath, { quality: 80 });

      // Then: 変換後のファイルが存在し、サイズ情報が返される
      expect(result.size).toBeGreaterThan(0);
      const outputExists = await fs
        .stat(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(outputExists).toBe(true);
    });

    // JPEG ファイルを WebP に変換できることをテスト
    it('JPEG ファイルを WebP 形式に変換できる', async () => {
      // Given: JPEG 画像ファイル
      const inputPath = path.join(fixturesDir, 'sample.jpg');
      const outputPath = path.join(outputDir, 'sample-from-jpg.webp');

      // When: WebP に変換
      const result = await adapter.convertToWebP(inputPath, outputPath, { quality: 80 });

      // Then: 変換後のファイルが存在し、サイズ情報が返される
      expect(result.size).toBeGreaterThan(0);
      const outputExists = await fs
        .stat(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(outputExists).toBe(true);
    });

    // GIF ファイルを WebP に変換できることをテスト
    it('GIF ファイルを WebP 形式に変換できる', async () => {
      // Given: GIF 画像ファイル
      const inputPath = path.join(fixturesDir, 'sample.gif');
      const outputPath = path.join(outputDir, 'sample-from-gif.webp');

      // When: WebP に変換
      const result = await adapter.convertToWebP(inputPath, outputPath, { quality: 80 });

      // Then: 変換後のファイルが存在し、サイズ情報が返される
      expect(result.size).toBeGreaterThan(0);
      const outputExists = await fs
        .stat(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(outputExists).toBe(true);
    });

    // 品質パラメータが適用されることをテスト
    it('品質パラメータが出力に適用される', async () => {
      // Given: 同じ入力ファイルで異なる品質設定
      // JPEG 画像は品質による差が出やすい
      const inputPath = path.join(fixturesDir, 'sample.jpg');
      const highQualityPath = path.join(outputDir, 'sample-high-quality.webp');
      const lowQualityPath = path.join(outputDir, 'sample-low-quality.webp');

      // When: 高品質と低品質でそれぞれ変換
      const highQualityResult = await adapter.convertToWebP(inputPath, highQualityPath, { quality: 100 });
      const lowQualityResult = await adapter.convertToWebP(inputPath, lowQualityPath, { quality: 1 });

      // Then: 異なる品質設定で異なるファイルサイズが生成される
      // 品質パラメータが正しく適用されていることを検証
      expect(highQualityResult.size).toBeGreaterThan(0);
      expect(lowQualityResult.size).toBeGreaterThan(0);
      // 品質パラメータが効果を持つことを確認（サイズが異なる）
      expect(highQualityResult.size).not.toBe(lowQualityResult.size);
    });

    // 存在しないファイルでエラーが発生することをテスト
    it('存在しないファイルでエラーをスローする', async () => {
      // Given: 存在しないファイルパス
      const inputPath = path.join(fixturesDir, 'non-existent.png');
      const outputPath = path.join(outputDir, 'output.webp');

      // When & Then: エラーがスローされる
      await expect(adapter.convertToWebP(inputPath, outputPath, { quality: 80 })).rejects.toThrow();
    });
  });

  describe('getMetadata', () => {
    // PNG ファイルのメタデータを取得できることをテスト
    it('PNG ファイルからメタデータを取得できる', async () => {
      // Given: PNG 画像ファイル
      const filePath = path.join(fixturesDir, 'sample.png');

      // When: メタデータを取得
      const metadata = await adapter.getMetadata(filePath);

      // Then: 幅、高さ、フォーマットが正しい
      expect(metadata.width).toBe(100);
      expect(metadata.height).toBe(100);
      expect(metadata.format).toBe('png');
    });

    // JPEG ファイルのメタデータを取得できることをテスト
    it('JPEG ファイルからメタデータを取得できる', async () => {
      // Given: JPEG 画像ファイル
      const filePath = path.join(fixturesDir, 'sample.jpg');

      // When: メタデータを取得
      const metadata = await adapter.getMetadata(filePath);

      // Then: 幅、高さ、フォーマットが正しい
      expect(metadata.width).toBe(100);
      expect(metadata.height).toBe(100);
      expect(metadata.format).toBe('jpeg');
    });

    // GIF ファイルのメタデータを取得できることをテスト
    it('GIF ファイルからメタデータを取得できる', async () => {
      // Given: GIF 画像ファイル
      const filePath = path.join(fixturesDir, 'sample.gif');

      // When: メタデータを取得
      const metadata = await adapter.getMetadata(filePath);

      // Then: 幅、高さ、フォーマットが正しい
      expect(metadata.width).toBe(100);
      expect(metadata.height).toBe(100);
      expect(metadata.format).toBe('gif');
    });

    // 存在しないファイルでエラーが発生することをテスト
    it('存在しないファイルでエラーをスローする', async () => {
      // Given: 存在しないファイルパス
      const filePath = path.join(fixturesDir, 'non-existent.png');

      // When & Then: エラーがスローされる
      await expect(adapter.getMetadata(filePath)).rejects.toThrow();
    });

    // 注: メタデータが不完全な場合のテストは、実際の画像ファイルでは
    // 再現が困難なため、ユニットテストでモックを使用してカバーする
  });
});
