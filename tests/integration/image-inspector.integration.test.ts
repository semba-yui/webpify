/**
 * ImageInspector の統合テスト
 * 実際の sharp/fs を使用して画像メタデータ取得機能をテストする
 */
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createFsAdapter } from '../../src/adapters/fs-adapter/index.js';
import { createSharpAdapter } from '../../src/adapters/sharp-adapter/index.js';
import { createImageInspector } from '../../src/core/image-inspector/index.js';

describe('ImageInspector Integration', () => {
  const fixturesDir = path.join(import.meta.dirname, '../fixtures');
  const inspector = createImageInspector({
    fileSystem: createFsAdapter(),
    imageProcessor: createSharpAdapter(),
  });

  describe('getInfo', () => {
    // PNG ファイルのメタデータを取得できることをテスト
    it('PNG ファイルのメタデータを取得できる', async () => {
      // Given: PNG 画像ファイル
      const filePath = path.join(fixturesDir, 'sample.png');

      // When: メタデータを取得
      const info = await inspector.getInfo(filePath);

      // Then: 正しいメタデータが返される
      expect(info.path).toBe(filePath);
      expect(info.size).toBeGreaterThan(0);
      expect(info.width).toBe(100);
      expect(info.height).toBe(100);
      expect(info.format).toBe('png');
    });

    // JPEG ファイルのメタデータを取得できることをテスト
    it('JPEG ファイルのメタデータを取得できる', async () => {
      // Given: JPEG 画像ファイル
      const filePath = path.join(fixturesDir, 'sample.jpg');

      // When: メタデータを取得
      const info = await inspector.getInfo(filePath);

      // Then: 正しいメタデータが返される
      expect(info.path).toBe(filePath);
      expect(info.size).toBeGreaterThan(0);
      expect(info.width).toBe(100);
      expect(info.height).toBe(100);
      expect(info.format).toBe('jpeg');
    });

    // GIF ファイルのメタデータを取得できることをテスト
    it('GIF ファイルのメタデータを取得できる', async () => {
      // Given: GIF 画像ファイル
      const filePath = path.join(fixturesDir, 'sample.gif');

      // When: メタデータを取得
      const info = await inspector.getInfo(filePath);

      // Then: 正しいメタデータが返される
      expect(info.path).toBe(filePath);
      expect(info.size).toBeGreaterThan(0);
      expect(info.width).toBe(100);
      expect(info.height).toBe(100);
      expect(info.format).toBe('gif');
    });
  });

  describe('getInfoBatch', () => {
    // 複数ファイルのメタデータを一括取得できることをテスト
    it('複数ファイルのメタデータを一括取得できる', async () => {
      // Given: 複数の画像ファイル
      const filePaths = [
        path.join(fixturesDir, 'sample.png'),
        path.join(fixturesDir, 'sample.jpg'),
        path.join(fixturesDir, 'sample.gif'),
      ];

      // When: バッチでメタデータを取得
      const infos = await inspector.getInfoBatch(filePaths);

      // Then: すべてのファイルの情報が返される
      expect(infos).toHaveLength(3);
      expect(infos.map((i) => i.format)).toContain('png');
      expect(infos.map((i) => i.format)).toContain('jpeg');
      expect(infos.map((i) => i.format)).toContain('gif');
    });

    // 空の配列を渡した場合は空の配列を返すことをテスト
    it('空の配列を渡した場合は空の配列を返す', async () => {
      // Given: 空のファイルリスト

      // When: バッチでメタデータを取得
      const infos = await inspector.getInfoBatch([]);

      // Then: 空の配列が返される
      expect(infos).toHaveLength(0);
    });
  });
});
