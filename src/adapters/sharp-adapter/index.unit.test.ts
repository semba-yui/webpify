import { beforeEach, describe, expect, it, vi } from 'vitest';

// sharp モジュールをモック化
vi.mock('sharp', () => {
  return {
    default: vi.fn(),
  };
});

import sharp from 'sharp';
import { createSharpAdapter } from './index.js';

/**
 * SharpAdapter のユニットテスト
 * モックを使用してエッジケースをテストする
 */
describe('SharpAdapter Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMetadata', () => {
    // width が undefined の場合にエラーをスローすることをテスト
    it('width が undefined の場合はエラーをスローする', async () => {
      // Given: width が undefined のメタデータを返すモック
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          format: 'png',
          height: 100,
          width: undefined,
        }),
      } as unknown as ReturnType<typeof sharp>);

      const adapter = createSharpAdapter();

      // When & Then: エラーがスローされる
      await expect(adapter.getMetadata('/path/to/image.png')).rejects.toThrow(
        'Failed to get metadata for /path/to/image.png',
      );
    });

    // height が undefined の場合にエラーをスローすることをテスト
    it('height が undefined の場合はエラーをスローする', async () => {
      // Given: height が undefined のメタデータを返すモック
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          format: 'png',
          height: undefined,
          width: 100,
        }),
      } as unknown as ReturnType<typeof sharp>);

      const adapter = createSharpAdapter();

      // When & Then: エラーがスローされる
      await expect(adapter.getMetadata('/path/to/image.png')).rejects.toThrow(
        'Failed to get metadata for /path/to/image.png',
      );
    });

    // format が undefined の場合にエラーをスローすることをテスト
    it('format が undefined の場合はエラーをスローする', async () => {
      // Given: format が undefined のメタデータを返すモック
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          format: undefined,
          height: 100,
          width: 100,
        }),
      } as unknown as ReturnType<typeof sharp>);

      const adapter = createSharpAdapter();

      // When & Then: エラーがスローされる
      await expect(adapter.getMetadata('/path/to/image.png')).rejects.toThrow(
        'Failed to get metadata for /path/to/image.png',
      );
    });

    // すべてのフィールドが undefined の場合にエラーをスローすることをテスト
    it('すべてのフィールドが undefined の場合はエラーをスローする', async () => {
      // Given: すべてのフィールドが undefined のメタデータを返すモック
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          format: undefined,
          height: undefined,
          width: undefined,
        }),
      } as unknown as ReturnType<typeof sharp>);

      const adapter = createSharpAdapter();

      // When & Then: エラーがスローされる
      await expect(adapter.getMetadata('/path/to/image.png')).rejects.toThrow(
        'Failed to get metadata for /path/to/image.png',
      );
    });

    // 正常なメタデータが返される場合のテスト
    it('すべてのフィールドが存在する場合は正常にメタデータを返す', async () => {
      // Given: 正常なメタデータを返すモック
      vi.mocked(sharp).mockReturnValue({
        metadata: vi.fn().mockResolvedValue({
          format: 'png',
          height: 200,
          width: 100,
        }),
      } as unknown as ReturnType<typeof sharp>);

      const adapter = createSharpAdapter();

      // When: メタデータを取得
      const result = await adapter.getMetadata('/path/to/image.png');

      // Then: 正しいメタデータが返される
      expect(result).toEqual({
        format: 'png',
        height: 200,
        width: 100,
      });
    });
  });

  describe('convertToWebP', () => {
    // 品質パラメータが sharp に正しく渡されることをテスト（lossy モード）
    it('lossy モードでは品質パラメータが sharp に正しく渡される', async () => {
      // Given: 正常に変換を行うモック
      const mockWebp = vi.fn().mockReturnThis();
      const mockToFile = vi.fn().mockResolvedValue({ size: 1024 });

      vi.mocked(sharp).mockReturnValue({
        toFile: mockToFile,
        webp: mockWebp,
      } as unknown as ReturnType<typeof sharp>);

      const adapter = createSharpAdapter();

      // When: lossy モード（lossless: false）で品質 75 で変換を実行
      await adapter.convertToWebP('/input.png', '/output.webp', { lossless: false, quality: 75 });

      // Then: webp() に品質パラメータが渡される
      expect(mockWebp).toHaveBeenCalledWith({ quality: 75 });
    });

    // lossless モードの場合に lossless: true が渡されることをテスト
    it('lossless モードでは lossless: true が sharp に渡される', async () => {
      // Given: 正常に変換を行うモック
      const mockWebp = vi.fn().mockReturnThis();
      const mockToFile = vi.fn().mockResolvedValue({ size: 2048 });

      vi.mocked(sharp).mockReturnValue({
        toFile: mockToFile,
        webp: mockWebp,
      } as unknown as ReturnType<typeof sharp>);

      const adapter = createSharpAdapter();

      // When: lossless モードで変換を実行
      await adapter.convertToWebP('/input.png', '/output.webp', { lossless: true, quality: 100 });

      // Then: webp() に lossless: true が渡される（quality は無視される）
      expect(mockWebp).toHaveBeenCalledWith({ lossless: true });
    });
  });
});
