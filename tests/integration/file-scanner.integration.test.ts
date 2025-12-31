/**
 * FileScanner の統合テスト
 * 実際のファイルシステムを使用してディレクトリスキャン機能をテストする
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createFsAdapter } from '../../src/adapters/fs-adapter/index.js';
import { createFileScanner } from '../../src/core/file-scanner/index.js';

describe('FileScanner Integration', () => {
  const testDir = path.join(import.meta.dirname, '../temp-scanner');
  let scanner: ReturnType<typeof createFileScanner>;

  beforeAll(async () => {
    // Given: テスト用の FileScanner を生成し、テスト用ディレクトリを作成
    scanner = createFileScanner({
      fileSystem: createFsAdapter(),
    });

    // テスト用ディレクトリ構造を作成
    await fs.mkdir(path.join(testDir, 'subdir'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'subdir', 'deep'), { recursive: true });

    // テスト用画像ファイル（実際は空ファイル）を作成
    await fs.writeFile(path.join(testDir, 'image1.png'), '');
    await fs.writeFile(path.join(testDir, 'image2.jpg'), '');
    await fs.writeFile(path.join(testDir, 'image3.gif'), '');
    await fs.writeFile(path.join(testDir, 'document.txt'), '');
    await fs.writeFile(path.join(testDir, 'subdir', 'image4.png'), '');
    await fs.writeFile(path.join(testDir, 'subdir', 'deep', 'image5.jpeg'), '');
    await fs.writeFile(path.join(testDir, 'existing.webp'), '');
  });

  afterAll(async () => {
    // テスト用ディレクトリをクリーンアップ
    await fs.rm(testDir, { force: true, recursive: true });
  });

  describe('非再帰スキャン', () => {
    // ディレクトリ内のファイルを拡張子でフィルタリングできることをテスト
    it('指定された拡張子のファイルのみを返す', async () => {
      // When: 画像ファイル拡張子でスキャン
      const result = await scanner.scan(testDir, {
        extensions: ['png', 'jpg', 'jpeg', 'gif'],
        recursive: false,
      });

      // Then: トップレベルの画像ファイルのみが返される
      expect(result).toHaveLength(3);
      expect(result.map((p) => path.basename(p))).toContain('image1.png');
      expect(result.map((p) => path.basename(p))).toContain('image2.jpg');
      expect(result.map((p) => path.basename(p))).toContain('image3.gif');
    });

    // WebP ファイルのみをフィルタリングできることをテスト
    it('WebP ファイルのみをフィルタリングできる', async () => {
      // When: WebP 拡張子でスキャン
      const result = await scanner.scan(testDir, {
        extensions: ['webp'],
        recursive: false,
      });

      // Then: WebP ファイルのみが返される
      expect(result).toHaveLength(1);
      const firstResult = result[0];
      expect(firstResult).toBeDefined();
      expect(path.basename(firstResult as string)).toBe('existing.webp');
    });

    // マッチするファイルがない場合は空配列を返すことをテスト
    it('マッチするファイルがない場合は空配列を返す', async () => {
      // When: 存在しない拡張子でスキャン
      const result = await scanner.scan(testDir, {
        extensions: ['bmp', 'tiff'],
        recursive: false,
      });

      // Then: 空配列が返される
      expect(result).toHaveLength(0);
    });
  });

  describe('再帰スキャン', () => {
    // サブディレクトリ内のファイルも含めて返すことをテスト
    it('サブディレクトリ内のファイルも含めて返す', async () => {
      // When: 再帰的にスキャン
      const result = await scanner.scan(testDir, {
        extensions: ['png', 'jpg', 'jpeg', 'gif'],
        recursive: true,
      });

      // Then: すべての画像ファイルが返される
      expect(result).toHaveLength(5);
      expect(result.map((p) => path.basename(p))).toContain('image1.png');
      expect(result.map((p) => path.basename(p))).toContain('image4.png');
      expect(result.map((p) => path.basename(p))).toContain('image5.jpeg');
    });

    // 深いネストのファイルも取得できることをテスト
    it('深いネストのファイルも取得できる', async () => {
      // When: 再帰的にスキャン
      const result = await scanner.scan(testDir, {
        extensions: ['jpeg'],
        recursive: true,
      });

      // Then: 深いネストのファイルも含まれる
      expect(result).toHaveLength(1);
      const firstResult = result[0];
      expect(firstResult).toBeDefined();
      expect(firstResult).toContain('deep');
      expect(path.basename(firstResult as string)).toBe('image5.jpeg');
    });
  });

  describe('isDirectory', () => {
    // ディレクトリに対して true を返すことをテスト
    it('ディレクトリに対して true を返す', async () => {
      // When: ディレクトリを判定
      const result = await scanner.isDirectory(testDir);

      // Then: true を返す
      expect(result).toBe(true);
    });

    // ファイルに対して false を返すことをテスト
    it('ファイルに対して false を返す', async () => {
      // When: ファイルを判定
      const result = await scanner.isDirectory(path.join(testDir, 'image1.png'));

      // Then: false を返す
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    // 存在するパスに対して true を返すことをテスト
    it('存在するパスに対して true を返す', async () => {
      // When: 存在確認
      const result = await scanner.exists(testDir);

      // Then: true を返す
      expect(result).toBe(true);
    });

    // 存在しないパスに対して false を返すことをテスト
    it('存在しないパスに対して false を返す', async () => {
      // When: 存在確認
      const result = await scanner.exists(path.join(testDir, 'nonexistent'));

      // Then: false を返す
      expect(result).toBe(false);
    });
  });
});
