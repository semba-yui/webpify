import sharp from 'sharp';
import type { ImageProcessorPort } from '../../ports/image-processor.js';

/**
 * sharp ライブラリを使用した ImageProcessorPort の実装
 * WebP 変換と画像メタデータ取得機能を提供する
 */
export function createSharpAdapter(): ImageProcessorPort {
  return {
    async convertToWebP(
      inputPath: string,
      outputPath: string,
      options: { quality: number },
    ): Promise<{ size: number }> {
      const result = await sharp(inputPath).webp({ quality: options.quality }).toFile(outputPath);

      return { size: result.size };
    },

    async getMetadata(filePath: string): Promise<{ format: string; height: number; width: number }> {
      const metadata = await sharp(filePath).metadata();

      if (!metadata.width || !metadata.height || !metadata.format) {
        throw new Error(`Failed to get metadata for ${filePath}`);
      }

      return {
        format: metadata.format,
        height: metadata.height,
        width: metadata.width,
      };
    },
  };
}
