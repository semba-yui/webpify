/**
 * FileScanner のプロパティベースドテスト
 *
 * プロパティベースドテストは、ランダムなテストデータを自動生成して
 * 不変条件（プロパティ）が常に満たされることを検証する。
 */
import { fc, test } from '@fast-check/vitest';
import { describe, expect, vi } from 'vitest';
import type { FileSystemPort } from '../../ports/file-system.js';
import { createFileScanner } from './index.js';

describe('FileScanner - Property Based Tests', () => {
  describe('拡張子フィルタリングの正規化', () => {
    /**
     * プロパティ: 拡張子の大文字小文字は区別しない
     *
     * 不変条件: 同じ拡張子の大文字小文字バリエーションは同じ結果を返す
     */
    test.prop([fc.constantFrom('png', 'jpg', 'jpeg', 'gif'), fc.stringMatching(/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/)])(
      'Given 拡張子の任意の大文字小文字バリエーション When scan を実行 Then 正しくフィルタリングされる',
      async (ext, filename) => {
        // Given: 3つのバリエーション（小文字、大文字、混在）を持つファイル
        const files = [
          `${filename}.${ext.toLowerCase()}`,
          `${filename}.${ext.toUpperCase()}`,
          `${filename}.${ext.charAt(0).toUpperCase()}${ext.slice(1).toLowerCase()}`,
        ];

        const mockFileSystem: FileSystemPort = {
          exists: vi.fn().mockResolvedValue(true),
          isDirectory: vi.fn().mockResolvedValue(true),
          mkdir: vi.fn().mockResolvedValue(undefined),
          readDir: vi.fn().mockResolvedValue(files),
          readDirRecursive: vi.fn().mockResolvedValue([]),
          stat: vi.fn().mockResolvedValue({ size: 1000 }),
        };

        const scanner = createFileScanner({ fileSystem: mockFileSystem });

        // When
        const result = await scanner.scan('/test', {
          extensions: [ext.toLowerCase()],
          recursive: false,
        });

        // Then: すべてのバリエーションがマッチする
        expect(result.length).toBe(3);
      },
    );

    /**
     * プロパティ: フィルタ拡張子自体も大文字小文字を区別しない
     *
     * 不変条件: フィルタに指定する拡張子の大文字小文字に関わらず同じ結果
     */
    test.prop([fc.constantFrom('png', 'jpg', 'jpeg', 'gif'), fc.boolean()])(
      'Given フィルタ拡張子の大文字小文字バリエーション When scan を実行 Then 同じ結果を返す',
      async (ext, useUpperCase) => {
        // Given
        const filterExt = useUpperCase ? ext.toUpperCase() : ext.toLowerCase();
        const files = [`image.${ext.toLowerCase()}`];

        const mockFileSystem: FileSystemPort = {
          exists: vi.fn().mockResolvedValue(true),
          isDirectory: vi.fn().mockResolvedValue(true),
          mkdir: vi.fn().mockResolvedValue(undefined),
          readDir: vi.fn().mockResolvedValue(files),
          readDirRecursive: vi.fn().mockResolvedValue([]),
          stat: vi.fn().mockResolvedValue({ size: 1000 }),
        };

        const scanner = createFileScanner({ fileSystem: mockFileSystem });

        // When
        const result = await scanner.scan('/test', {
          extensions: [filterExt],
          recursive: false,
        });

        // Then: 大文字小文字に関わらず同じ結果
        expect(result.length).toBe(1);
      },
    );
  });

  describe('排他フィルタの不変条件', () => {
    /**
     * プロパティ: 指定されていない拡張子は絶対にマッチしない
     *
     * 不変条件: フィルタに含まれない拡張子のファイルは結果に含まれない
     */
    test.prop([
      fc.constantFrom('png', 'jpg', 'jpeg', 'gif'),
      fc.constantFrom('txt', 'pdf', 'doc', 'bmp', 'tiff', 'webp'),
      fc.stringMatching(/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/),
    ])(
      'Given フィルタに含まれない拡張子のファイル When scan を実行 Then 結果に含まれない',
      async (filterExt, otherExt, filename) => {
        // Given: フィルタ対象外の拡張子のファイルのみ
        const files = [`${filename}.${otherExt}`];

        const mockFileSystem: FileSystemPort = {
          exists: vi.fn().mockResolvedValue(true),
          isDirectory: vi.fn().mockResolvedValue(true),
          mkdir: vi.fn().mockResolvedValue(undefined),
          readDir: vi.fn().mockResolvedValue(files),
          readDirRecursive: vi.fn().mockResolvedValue([]),
          stat: vi.fn().mockResolvedValue({ size: 1000 }),
        };

        const scanner = createFileScanner({ fileSystem: mockFileSystem });

        // When
        const result = await scanner.scan('/test', {
          extensions: [filterExt],
          recursive: false,
        });

        // Then: 結果は空
        expect(result.length).toBe(0);
      },
    );

    /**
     * プロパティ: フィルタに含まれる拡張子のみがマッチする
     *
     * 不変条件: 結果に含まれるファイルはすべてフィルタ拡張子を持つ
     */
    test.prop([
      fc.array(fc.constantFrom('png', 'jpg', 'jpeg', 'gif'), { maxLength: 4, minLength: 1 }),
      fc.array(fc.constantFrom('txt', 'pdf', 'doc', 'bmp'), { maxLength: 4, minLength: 0 }),
      fc.stringMatching(/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/),
    ])(
      'Given 混在したファイル When scan を実行 Then フィルタ拡張子のみが返される',
      async (matchingExts, nonMatchingExts, filename) => {
        // Given: マッチするファイルとマッチしないファイルの混在
        const matchingFiles = matchingExts.map((ext) => `${filename}_m.${ext}`);
        const nonMatchingFiles = nonMatchingExts.map((ext) => `${filename}_n.${ext}`);
        const allFiles = [...matchingFiles, ...nonMatchingFiles];

        const mockFileSystem: FileSystemPort = {
          exists: vi.fn().mockResolvedValue(true),
          isDirectory: vi.fn().mockResolvedValue(true),
          mkdir: vi.fn().mockResolvedValue(undefined),
          readDir: vi.fn().mockResolvedValue(allFiles),
          readDirRecursive: vi.fn().mockResolvedValue([]),
          stat: vi.fn().mockResolvedValue({ size: 1000 }),
        };

        const scanner = createFileScanner({ fileSystem: mockFileSystem });

        // When
        const result = await scanner.scan('/test', {
          extensions: ['png', 'jpg', 'jpeg', 'gif'],
          recursive: false,
        });

        // Then: マッチするファイルのみが返される
        expect(result.length).toBe(matchingFiles.length);
        // 結果に非マッチファイルが含まれていないことを確認
        for (const file of nonMatchingFiles) {
          expect(result).not.toContain(expect.stringContaining(file));
        }
      },
    );
  });

  describe('再帰モードの不変条件', () => {
    /**
     * プロパティ: 再帰モードでも拡張子フィルタは同様に機能する
     *
     * 不変条件: recursive: true でも拡張子フィルタリングは変わらない
     */
    test.prop([fc.constantFrom('png', 'jpg', 'jpeg', 'gif'), fc.boolean()])(
      'Given 再帰モード When scan を実行 Then 拡張子フィルタは同様に機能する',
      async (ext, recursive) => {
        // Given
        const files = recursive
          ? [`/test/sub/image.${ext}`, `/test/deep/nested/photo.${ext}`]
          : [`image.${ext}`, `photo.${ext}`];

        const mockFileSystem: FileSystemPort = {
          exists: vi.fn().mockResolvedValue(true),
          isDirectory: vi.fn().mockResolvedValue(true),
          mkdir: vi.fn().mockResolvedValue(undefined),
          readDir: vi.fn().mockResolvedValue(files),
          readDirRecursive: vi.fn().mockResolvedValue(files),
          stat: vi.fn().mockResolvedValue({ size: 1000 }),
        };

        const scanner = createFileScanner({ fileSystem: mockFileSystem });

        // When
        const result = await scanner.scan('/test', {
          extensions: [ext],
          recursive,
        });

        // Then: ファイル数は同じ
        expect(result.length).toBe(2);
      },
    );
  });

  describe('exists と isDirectory のプロキシ', () => {
    /**
     * プロパティ: exists は fileSystem.exists の結果をそのまま返す
     */
    test.prop([fc.boolean()])(
      'Given 任意の存在状態 When exists を呼び出す Then fileSystem.exists の結果が返される',
      async (existsResult) => {
        // Given
        const mockFileSystem: FileSystemPort = {
          exists: vi.fn().mockResolvedValue(existsResult),
          isDirectory: vi.fn().mockResolvedValue(false),
          mkdir: vi.fn().mockResolvedValue(undefined),
          readDir: vi.fn().mockResolvedValue([]),
          readDirRecursive: vi.fn().mockResolvedValue([]),
          stat: vi.fn().mockResolvedValue({ size: 0 }),
        };

        const scanner = createFileScanner({ fileSystem: mockFileSystem });

        // When
        const result = await scanner.exists('/any/path');

        // Then
        expect(result).toBe(existsResult);
      },
    );

    /**
     * プロパティ: isDirectory は fileSystem.isDirectory の結果をそのまま返す
     */
    test.prop([fc.boolean()])(
      'Given 任意のディレクトリ状態 When isDirectory を呼び出す Then fileSystem.isDirectory の結果が返される',
      async (isDirResult) => {
        // Given
        const mockFileSystem: FileSystemPort = {
          exists: vi.fn().mockResolvedValue(true),
          isDirectory: vi.fn().mockResolvedValue(isDirResult),
          mkdir: vi.fn().mockResolvedValue(undefined),
          readDir: vi.fn().mockResolvedValue([]),
          readDirRecursive: vi.fn().mockResolvedValue([]),
          stat: vi.fn().mockResolvedValue({ size: 0 }),
        };

        const scanner = createFileScanner({ fileSystem: mockFileSystem });

        // When
        const result = await scanner.isDirectory('/any/path');

        // Then
        expect(result).toBe(isDirResult);
      },
    );
  });
});
