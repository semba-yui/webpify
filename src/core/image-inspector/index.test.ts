import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileSystemPort } from '../../ports/file-system.js';
import type { ImageProcessorPort } from '../../ports/image-processor.js';
import { createImageInspector } from './index.js';

/**
 * ImageInspector のユニットテスト
 * WebP ファイルのメタデータ取得機能をテスト
 */
describe('ImageInspector', () => {
  let mockFileSystem: FileSystemPort;
  let mockImageProcessor: ImageProcessorPort;
  let inspector: ReturnType<typeof createImageInspector>;

  beforeEach(() => {
    // Given: モック化されたポートを準備
    mockFileSystem = {
      exists: vi.fn(),
      isDirectory: vi.fn(),
      mkdir: vi.fn(),
      readDir: vi.fn(),
      readDirRecursive: vi.fn(),
      stat: vi.fn(),
    };
    mockImageProcessor = {
      convertToWebP: vi.fn(),
      getMetadata: vi.fn(),
    };
    inspector = createImageInspector({
      fileSystem: mockFileSystem,
      imageProcessor: mockImageProcessor,
    });
  });

  describe('getInfo', () => {
    // 単一ファイルのメタデータ取得テスト（Requirement 8.1, 8.4）
    it('WebP ファイルのメタデータを取得して返す', async () => {
      // Given: WebP ファイルが存在し、メタデータが取得可能
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 12345 });
      vi.mocked(mockImageProcessor.getMetadata).mockResolvedValue({
        format: 'webp',
        height: 600,
        width: 800,
      });

      // When: メタデータを取得する
      const info = await inspector.getInfo('/images/photo.webp');

      // Then: 正しいメタデータが返される
      expect(info.path).toBe('/images/photo.webp');
      expect(info.size).toBe(12345);
      expect(info.width).toBe(800);
      expect(info.height).toBe(600);
      expect(info.format).toBe('webp');
    });

    // ファイルサイズが正しく取得されるテスト
    it('ファイルサイズはファイルシステムから取得される', async () => {
      // Given: ファイルサイズが 5000 バイト
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 5000 });
      vi.mocked(mockImageProcessor.getMetadata).mockResolvedValue({
        format: 'webp',
        height: 100,
        width: 100,
      });

      // When: メタデータを取得する
      const info = await inspector.getInfo('/images/small.webp');

      // Then: ファイルサイズが正しく取得される
      expect(info.size).toBe(5000);
      expect(mockFileSystem.stat).toHaveBeenCalledWith('/images/small.webp');
    });

    // 画像の寸法が正しく取得されるテスト
    it('画像の幅と高さは ImageProcessor から取得される', async () => {
      // Given: 画像サイズが 1920x1080
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 100000 });
      vi.mocked(mockImageProcessor.getMetadata).mockResolvedValue({
        format: 'webp',
        height: 1080,
        width: 1920,
      });

      // When: メタデータを取得する
      const info = await inspector.getInfo('/images/hd.webp');

      // Then: 画像の寸法が正しく取得される
      expect(info.width).toBe(1920);
      expect(info.height).toBe(1080);
      expect(mockImageProcessor.getMetadata).toHaveBeenCalledWith('/images/hd.webp');
    });

    // フォーマット情報が正しく取得されるテスト
    it('画像フォーマットは ImageProcessor から取得される', async () => {
      // Given: PNG 画像（WebP 以外も対応）
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 50000 });
      vi.mocked(mockImageProcessor.getMetadata).mockResolvedValue({
        format: 'png',
        height: 400,
        width: 300,
      });

      // When: メタデータを取得する
      const info = await inspector.getInfo('/images/image.png');

      // Then: フォーマットが正しく取得される
      expect(info.format).toBe('png');
    });
  });

  describe('getInfoBatch', () => {
    // 複数ファイルのバッチ処理テスト
    it('複数ファイルのメタデータを一括取得する', async () => {
      // Given: 3つのファイルが存在する
      const filePaths = ['/images/photo1.webp', '/images/photo2.webp', '/images/photo3.webp'];

      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 10000 });
      vi.mocked(mockImageProcessor.getMetadata).mockResolvedValue({
        format: 'webp',
        height: 600,
        width: 800,
      });

      // When: バッチでメタデータを取得する
      const infos = await inspector.getInfoBatch(filePaths);

      // Then: 3つのファイル情報が返される
      expect(infos).toHaveLength(3);
      expect(infos[0].path).toBe('/images/photo1.webp');
      expect(infos[1].path).toBe('/images/photo2.webp');
      expect(infos[2].path).toBe('/images/photo3.webp');
    });

    // 空の配列の場合のテスト
    it('空の配列を渡した場合は空の配列を返す', async () => {
      // Given: 空のファイルリスト

      // When: バッチでメタデータを取得する
      const infos = await inspector.getInfoBatch([]);

      // Then: 空の配列が返される
      expect(infos).toHaveLength(0);
    });

    // 各ファイルの情報が個別に正しく取得されるテスト
    it('各ファイルの情報が個別に正しく取得される', async () => {
      // Given: 異なるサイズの2つのファイル
      const filePaths = ['/images/small.webp', '/images/large.webp'];

      vi.mocked(mockFileSystem.stat).mockResolvedValueOnce({ size: 1000 }).mockResolvedValueOnce({ size: 50000 });
      vi.mocked(mockImageProcessor.getMetadata)
        .mockResolvedValueOnce({ format: 'webp', height: 100, width: 100 })
        .mockResolvedValueOnce({ format: 'webp', height: 1000, width: 1000 });

      // When: バッチでメタデータを取得する
      const infos = await inspector.getInfoBatch(filePaths);

      // Then: 各ファイルの情報が正しく取得される
      expect(infos[0].size).toBe(1000);
      expect(infos[0].width).toBe(100);
      expect(infos[0].height).toBe(100);
      expect(infos[1].size).toBe(50000);
      expect(infos[1].width).toBe(1000);
      expect(infos[1].height).toBe(1000);
    });
  });
});
