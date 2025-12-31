import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FileSystemPort } from '../../ports/file-system.js';
import { createFsAdapter } from './index.js';

/**
 * ファイルシステムアダプターのテスト
 * 実際の fs モジュールを使用してファイル操作機能をテストする
 */
describe('FsAdapter', () => {
  let adapter: FileSystemPort;
  const fixturesDir = path.join(import.meta.dirname, '../../../tests/fixtures');
  const testDir = path.join(import.meta.dirname, '../../../tests/temp');

  beforeAll(async () => {
    adapter = createFsAdapter();
    // テスト用ディレクトリを作成
    await fs.mkdir(testDir, { recursive: true });
    // サブディレクトリを作成
    await fs.mkdir(path.join(testDir, 'subdir'), { recursive: true });
    // テスト用ファイルを作成
    await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
    await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2');
    await fs.writeFile(path.join(testDir, 'subdir', 'file3.txt'), 'content3');
  });

  afterAll(async () => {
    // テスト用ディレクトリをクリーンアップ
    await fs.rm(testDir, { force: true, recursive: true });
  });

  describe('exists', () => {
    // 存在するファイルに対して true を返すことをテスト
    it('存在するファイルに対して true を返す', async () => {
      // Given: 存在するファイルパス
      const filePath = path.join(fixturesDir, 'sample.png');

      // When: 存在確認
      const result = await adapter.exists(filePath);

      // Then: true を返す
      expect(result).toBe(true);
    });

    // 存在しないファイルに対して false を返すことをテスト
    it('存在しないファイルに対して false を返す', async () => {
      // Given: 存在しないファイルパス
      const filePath = path.join(fixturesDir, 'non-existent.png');

      // When: 存在確認
      const result = await adapter.exists(filePath);

      // Then: false を返す
      expect(result).toBe(false);
    });

    // 存在するディレクトリに対して true を返すことをテスト
    it('存在するディレクトリに対して true を返す', async () => {
      // Given: 存在するディレクトリパス
      const dirPath = fixturesDir;

      // When: 存在確認
      const result = await adapter.exists(dirPath);

      // Then: true を返す
      expect(result).toBe(true);
    });
  });

  describe('isDirectory', () => {
    // ディレクトリに対して true を返すことをテスト
    it('ディレクトリに対して true を返す', async () => {
      // Given: ディレクトリパス
      const dirPath = fixturesDir;

      // When: ディレクトリ判定
      const result = await adapter.isDirectory(dirPath);

      // Then: true を返す
      expect(result).toBe(true);
    });

    // ファイルに対して false を返すことをテスト
    it('ファイルに対して false を返す', async () => {
      // Given: ファイルパス
      const filePath = path.join(fixturesDir, 'sample.png');

      // When: ディレクトリ判定
      const result = await adapter.isDirectory(filePath);

      // Then: false を返す
      expect(result).toBe(false);
    });

    // 存在しないパスに対して false を返すことをテスト
    it('存在しないパスに対して false を返す', async () => {
      // Given: 存在しないパス
      const nonExistentPath = path.join(fixturesDir, 'non-existent');

      // When: ディレクトリ判定
      const result = await adapter.isDirectory(nonExistentPath);

      // Then: false を返す
      expect(result).toBe(false);
    });
  });

  describe('readDir', () => {
    // ディレクトリ内のファイル一覧を取得できることをテスト
    it('ディレクトリ内のファイル一覧を取得できる', async () => {
      // Given: ファイルを含むディレクトリ
      const dirPath = testDir;

      // When: ディレクトリ内容を取得
      const result = await adapter.readDir(dirPath);

      // Then: ファイルとサブディレクトリが含まれる
      expect(result).toContain('file1.txt');
      expect(result).toContain('file2.txt');
      expect(result).toContain('subdir');
    });

    // 存在しないディレクトリでエラーが発生することをテスト
    it('存在しないディレクトリでエラーをスローする', async () => {
      // Given: 存在しないディレクトリ
      const nonExistentDir = path.join(testDir, 'non-existent');

      // When & Then: エラーがスローされる
      await expect(adapter.readDir(nonExistentDir)).rejects.toThrow();
    });
  });

  describe('readDirRecursive', () => {
    // 再帰的にファイルを取得できることをテスト
    it('再帰的にすべてのファイルを取得できる', async () => {
      // Given: サブディレクトリを含むディレクトリ
      const dirPath = testDir;

      // When: 再帰的にファイルを取得
      const result = await adapter.readDirRecursive(dirPath);

      // Then: サブディレクトリ内のファイルも含まれる
      const fileNames = result.map((p) => path.basename(p));
      expect(fileNames).toContain('file1.txt');
      expect(fileNames).toContain('file2.txt');
      expect(fileNames).toContain('file3.txt');
    });

    // 絶対パスで返されることをテスト
    it('絶対パスで返す', async () => {
      // Given: ディレクトリパス
      const dirPath = testDir;

      // When: 再帰的にファイルを取得
      const result = await adapter.readDirRecursive(dirPath);

      // Then: すべて絶対パスである
      for (const filePath of result) {
        expect(path.isAbsolute(filePath)).toBe(true);
      }
    });
  });

  describe('mkdir', () => {
    // ディレクトリを作成できることをテスト
    it('ディレクトリを作成できる', async () => {
      // Given: 存在しないディレクトリパス
      const newDir = path.join(testDir, 'new-dir');

      // When: ディレクトリを作成
      await adapter.mkdir(newDir);

      // Then: ディレクトリが存在する
      const stat = await fs.stat(newDir);
      expect(stat.isDirectory()).toBe(true);
    });

    // 再帰的にディレクトリを作成できることをテスト
    it('ネストしたディレクトリを再帰的に作成できる', async () => {
      // Given: ネストしたディレクトリパス
      const nestedDir = path.join(testDir, 'nested', 'deep', 'dir');

      // When: ディレクトリを作成
      await adapter.mkdir(nestedDir);

      // Then: ディレクトリが存在する
      const stat = await fs.stat(nestedDir);
      expect(stat.isDirectory()).toBe(true);
    });

    // 既存ディレクトリに対してエラーが発生しないことをテスト
    it('既存ディレクトリに対してエラーをスローしない', async () => {
      // Given: 既存のディレクトリ
      const existingDir = testDir;

      // When & Then: エラーが発生しない
      await expect(adapter.mkdir(existingDir)).resolves.toBeUndefined();
    });
  });

  describe('stat', () => {
    // ファイルサイズを取得できることをテスト
    it('ファイルサイズを取得できる', async () => {
      // Given: ファイルパス
      const filePath = path.join(testDir, 'file1.txt');

      // When: ファイル統計情報を取得
      const result = await adapter.stat(filePath);

      // Then: サイズが正しい（'content1' = 8 bytes）
      expect(result.size).toBe(8);
    });

    // 存在しないファイルでエラーが発生することをテスト
    it('存在しないファイルでエラーをスローする', async () => {
      // Given: 存在しないファイル
      const nonExistentFile = path.join(testDir, 'non-existent.txt');

      // When & Then: エラーがスローされる
      await expect(adapter.stat(nonExistentFile)).rejects.toThrow();
    });
  });
});
