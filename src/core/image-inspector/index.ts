import type { FileSystemPort } from '../../ports/file-system.js';
import type { ImageProcessorPort } from '../../ports/image-processor.js';
import type { ImageInfo } from '../../types/index.js';

/**
 * ImageInspector の依存性
 */
export interface ImageInspectorDependencies {
  fileSystem: FileSystemPort;
  imageProcessor: ImageProcessorPort;
}

/**
 * ImageInspector サービスインターフェース
 */
export interface ImageInspectorService {
  /**
   * 画像ファイルのメタデータを取得する
   * @param filePath ファイルパス
   * @returns 画像情報
   */
  getInfo(filePath: string): Promise<ImageInfo>;

  /**
   * 複数の画像ファイルのメタデータを一括取得する
   * @param filePaths ファイルパスの配列
   * @returns 画像情報の配列
   */
  getInfoBatch(filePaths: string[]): Promise<ImageInfo[]>;
}

/**
 * ImageInspector を生成するファクトリ関数
 * @param deps 依存性
 * @returns ImageInspectorService インスタンス
 */
export function createImageInspector(deps: ImageInspectorDependencies): ImageInspectorService {
  const { fileSystem, imageProcessor } = deps;

  return {
    async getInfo(filePath: string): Promise<ImageInfo> {
      // ファイルサイズを取得
      const stat = await fileSystem.stat(filePath);

      // 画像のメタデータを取得
      const metadata = await imageProcessor.getMetadata(filePath);

      return {
        format: metadata.format,
        height: metadata.height,
        path: filePath,
        size: stat.size,
        width: metadata.width,
      };
    },

    async getInfoBatch(filePaths: string[]): Promise<ImageInfo[]> {
      const results: ImageInfo[] = [];

      for (const filePath of filePaths) {
        const info = await this.getInfo(filePath);
        results.push(info);
      }

      return results;
    },
  };
}
