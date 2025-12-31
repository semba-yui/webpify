import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileSystemPort } from '../../ports/file-system.js';
import { createFileScanner } from './index.js';

/**
 * FileScanner のユニットテスト
 * モック注入によりファイルシステム依存を排除してテスト
 */
describe('FileScanner', () => {
  let mockFileSystem: FileSystemPort;
  let fileScanner: ReturnType<typeof createFileScanner>;

  beforeEach(() => {
    // Given: モック化されたファイルシステムポートを準備
    mockFileSystem = {
      exists: vi.fn(),
      isDirectory: vi.fn(),
      mkdir: vi.fn(),
      readDir: vi.fn(),
      readDirRecursive: vi.fn(),
      stat: vi.fn(),
    };
    fileScanner = createFileScanner({ fileSystem: mockFileSystem });
  });

  describe('scan', () => {
    describe('非再帰モード', () => {
      it('指定されたディレクトリ内のファイルを拡張子でフィルタリングして返す', async () => {
        // Given: ディレクトリ内に複数のファイルが存在する
        vi.mocked(mockFileSystem.readDir).mockResolvedValue([
          'image1.png',
          'image2.jpg',
          'document.txt',
          'image3.gif',
          'script.js',
        ]);

        // When: PNG, JPEG, GIF 拡張子でスキャンする
        const result = await fileScanner.scan('/test/images', {
          extensions: ['png', 'jpg', 'jpeg', 'gif'],
          recursive: false,
        });

        // Then: 対象拡張子のファイルのみが返される
        expect(result).toEqual(['/test/images/image1.png', '/test/images/image2.jpg', '/test/images/image3.gif']);
        expect(mockFileSystem.readDir).toHaveBeenCalledWith('/test/images');
      });

      it('WebP ファイルのみをフィルタリングできる', async () => {
        // Given: ディレクトリ内に WebP ファイルと他のファイルが存在する
        vi.mocked(mockFileSystem.readDir).mockResolvedValue([
          'image1.webp',
          'image2.png',
          'image3.webp',
          'document.pdf',
        ]);

        // When: WebP 拡張子でスキャンする
        const result = await fileScanner.scan('/test/images', {
          extensions: ['webp'],
          recursive: false,
        });

        // Then: WebP ファイルのみが返される
        expect(result).toEqual(['/test/images/image1.webp', '/test/images/image3.webp']);
      });

      it('大文字小文字を区別せずにフィルタリングする', async () => {
        // Given: 様々なケースの拡張子を持つファイルが存在する
        vi.mocked(mockFileSystem.readDir).mockResolvedValue(['image1.PNG', 'image2.Jpg', 'image3.JPEG', 'image4.gif']);

        // When: 小文字の拡張子でスキャンする
        const result = await fileScanner.scan('/test/images', {
          extensions: ['png', 'jpg', 'jpeg', 'gif'],
          recursive: false,
        });

        // Then: 大文字小文字に関わらずマッチしたファイルが返される
        expect(result).toEqual([
          '/test/images/image1.PNG',
          '/test/images/image2.Jpg',
          '/test/images/image3.JPEG',
          '/test/images/image4.gif',
        ]);
      });

      it('マッチするファイルがない場合は空配列を返す', async () => {
        // Given: ディレクトリ内にマッチするファイルがない
        vi.mocked(mockFileSystem.readDir).mockResolvedValue(['document.txt', 'script.js']);

        // When: 画像拡張子でスキャンする
        const result = await fileScanner.scan('/test/images', {
          extensions: ['png', 'jpg', 'jpeg', 'gif'],
          recursive: false,
        });

        // Then: 空配列が返される
        expect(result).toEqual([]);
      });

      it('空のディレクトリの場合は空配列を返す', async () => {
        // Given: 空のディレクトリ
        vi.mocked(mockFileSystem.readDir).mockResolvedValue([]);

        // When: スキャンする
        const result = await fileScanner.scan('/test/empty', {
          extensions: ['png'],
          recursive: false,
        });

        // Then: 空配列が返される
        expect(result).toEqual([]);
      });
    });

    describe('再帰モード', () => {
      it('サブディレクトリ内のファイルも含めてフィルタリングする', async () => {
        // Given: サブディレクトリを含むディレクトリ構造
        vi.mocked(mockFileSystem.readDirRecursive).mockResolvedValue([
          '/test/images/image1.png',
          '/test/images/sub/image2.jpg',
          '/test/images/sub/deep/image3.gif',
          '/test/images/document.txt',
        ]);

        // When: 再帰モードでスキャンする
        const result = await fileScanner.scan('/test/images', {
          extensions: ['png', 'jpg', 'jpeg', 'gif'],
          recursive: true,
        });

        // Then: サブディレクトリのファイルも含めて返される
        expect(result).toEqual([
          '/test/images/image1.png',
          '/test/images/sub/image2.jpg',
          '/test/images/sub/deep/image3.gif',
        ]);
        expect(mockFileSystem.readDirRecursive).toHaveBeenCalledWith('/test/images');
      });
    });
  });

  describe('isDirectory', () => {
    it('ディレクトリの場合は true を返す', async () => {
      // Given: パスがディレクトリ
      vi.mocked(mockFileSystem.isDirectory).mockResolvedValue(true);

      // When: ディレクトリ判定を行う
      const result = await fileScanner.isDirectory('/test/images');

      // Then: true が返される
      expect(result).toBe(true);
      expect(mockFileSystem.isDirectory).toHaveBeenCalledWith('/test/images');
    });

    it('ファイルの場合は false を返す', async () => {
      // Given: パスがファイル
      vi.mocked(mockFileSystem.isDirectory).mockResolvedValue(false);

      // When: ディレクトリ判定を行う
      const result = await fileScanner.isDirectory('/test/image.png');

      // Then: false が返される
      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('パスが存在する場合は true を返す', async () => {
      // Given: パスが存在する
      vi.mocked(mockFileSystem.exists).mockResolvedValue(true);

      // When: 存在確認を行う
      const result = await fileScanner.exists('/test/images');

      // Then: true が返される
      expect(result).toBe(true);
      expect(mockFileSystem.exists).toHaveBeenCalledWith('/test/images');
    });

    it('パスが存在しない場合は false を返す', async () => {
      // Given: パスが存在しない
      vi.mocked(mockFileSystem.exists).mockResolvedValue(false);

      // When: 存在確認を行う
      const result = await fileScanner.exists('/test/nonexistent');

      // Then: false が返される
      expect(result).toBe(false);
    });
  });
});
