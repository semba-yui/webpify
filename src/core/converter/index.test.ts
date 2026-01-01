import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileSystemPort } from '../../ports/file-system.js';
import type { ImageProcessorPort } from '../../ports/image-processor.js';
import { createConverter } from './index.js';

/**
 * Converter のユニットテスト
 * モック注入によりファイルシステムと画像処理の依存を排除してテスト
 */
describe('Converter', () => {
  let mockFileSystem: FileSystemPort;
  let mockImageProcessor: ImageProcessorPort;
  let converter: ReturnType<typeof createConverter>;

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
    converter = createConverter({
      fileSystem: mockFileSystem,
      imageProcessor: mockImageProcessor,
    });
  });

  describe('isSupportedFormat', () => {
    // PNG 形式がサポートされていることを確認するテスト
    it('PNG ファイルに対して true を返す', () => {
      // When: PNG ファイルのサポート判定を行う
      const result = converter.isSupportedFormat('image.png');

      // Then: true が返される
      expect(result).toBe(true);
    });

    // JPEG 形式がサポートされていることを確認するテスト
    it('JPEG ファイル（.jpeg）に対して true を返す', () => {
      // When: JPEG ファイルのサポート判定を行う
      const result = converter.isSupportedFormat('image.jpeg');

      // Then: true が返される
      expect(result).toBe(true);
    });

    // JPG 形式がサポートされていることを確認するテスト
    it('JPEG ファイル（.jpg）に対して true を返す', () => {
      // When: JPG ファイルのサポート判定を行う
      const result = converter.isSupportedFormat('image.jpg');

      // Then: true が返される
      expect(result).toBe(true);
    });

    // GIF 形式がサポートされていることを確認するテスト
    it('GIF ファイルに対して true を返す', () => {
      // When: GIF ファイルのサポート判定を行う
      const result = converter.isSupportedFormat('image.gif');

      // Then: true が返される
      expect(result).toBe(true);
    });

    // 大文字拡張子もサポートされることを確認するテスト
    it('大文字の拡張子でも true を返す', () => {
      // When: 大文字拡張子のファイルを判定する
      const resultPng = converter.isSupportedFormat('image.PNG');
      const resultJpeg = converter.isSupportedFormat('image.JPEG');
      const resultGif = converter.isSupportedFormat('image.GIF');

      // Then: すべて true が返される
      expect(resultPng).toBe(true);
      expect(resultJpeg).toBe(true);
      expect(resultGif).toBe(true);
    });

    // サポート外形式に対して false を返すテスト
    it('サポート外の形式（BMP）に対して false を返す', () => {
      // When: BMP ファイルのサポート判定を行う
      const result = converter.isSupportedFormat('image.bmp');

      // Then: false が返される
      expect(result).toBe(false);
    });

    // WebP は変換対象ではないことを確認するテスト
    it('WebP ファイルに対して false を返す（変換対象ではない）', () => {
      // When: WebP ファイルのサポート判定を行う
      const result = converter.isSupportedFormat('image.webp');

      // Then: false が返される
      expect(result).toBe(false);
    });

    // 拡張子のないファイルに対して false を返すテスト
    it('拡張子のないファイルに対して false を返す', () => {
      // When: 拡張子のないファイルを判定する
      const result = converter.isSupportedFormat('noextension');

      // Then: false が返される
      expect(result).toBe(false);
    });
  });

  describe('convert', () => {
    // 単一ファイルの正常変換テスト
    it('PNG ファイルを WebP に変換して結果を返す', async () => {
      // Given: 入力ファイルが存在し、出力先は存在しない
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        // 入力ファイルとディレクトリは存在、出力ファイルは存在しない
        return path === '/images/photo.png' || path === '/images';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2048 });
      vi.mocked(mockImageProcessor.convertToWebP).mockResolvedValue({ size: 1024 });

      // When: 変換を実行する
      const result = await converter.convert('/images/photo.png', {
        force: false,
        quality: 80,
      });

      // Then: 変換結果が正しく返される
      expect(result.inputPath).toBe('/images/photo.png');
      expect(result.outputPath).toBe('/images/photo.webp');
      expect(result.inputSize).toBe(2048);
      expect(result.outputSize).toBe(1024);
      expect(result.skipped).toBe(false);
      expect(result.error).toBeUndefined();
    });

    // 出力パスが入力ファイル名 + .webp になることを確認するテスト
    it('出力ファイル名は入力ファイル名に .webp を付けたものになる', async () => {
      // Given: 入力ファイルが存在し、出力ファイルは存在しない
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        return path === '/path/to/image.jpeg' || path === '/path/to';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 1000 });
      vi.mocked(mockImageProcessor.convertToWebP).mockResolvedValue({ size: 500 });

      // When: 変換を実行する
      await converter.convert('/path/to/image.jpeg', {
        force: false,
        quality: 80,
      });

      // Then: 出力パスが正しい
      expect(mockImageProcessor.convertToWebP).toHaveBeenCalledWith('/path/to/image.jpeg', '/path/to/image.webp', {
        quality: 80,
      });
    });

    // 出力先オプション指定時のテスト
    it('出力先オプションが指定された場合はそのディレクトリに出力する', async () => {
      // Given: ファイルが存在し、出力先ディレクトリも存在する
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        // 入力ファイルは存在、出力ファイルは存在しない
        return path === '/images/photo.png' || path === '/output';
      });
      vi.mocked(mockFileSystem.isDirectory).mockResolvedValue(true);
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2048 });
      vi.mocked(mockImageProcessor.convertToWebP).mockResolvedValue({ size: 1024 });

      // When: 出力先を指定して変換を実行する
      const result = await converter.convert('/images/photo.png', {
        force: false,
        output: '/output',
        quality: 80,
      });

      // Then: 出力先ディレクトリにファイルが作成される
      expect(result.outputPath).toBe('/output/photo.webp');
      expect(mockImageProcessor.convertToWebP).toHaveBeenCalledWith('/images/photo.png', '/output/photo.webp', {
        quality: 80,
      });
    });

    // 出力ディレクトリの自動作成テスト
    it('出力先ディレクトリが存在しない場合は自動作成する', async () => {
      // Given: 入力ファイルは存在するが、出力先ディレクトリは存在しない
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        return path === '/images/photo.png';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2048 });
      vi.mocked(mockImageProcessor.convertToWebP).mockResolvedValue({ size: 1024 });

      // When: 存在しない出力先を指定して変換を実行する
      await converter.convert('/images/photo.png', {
        force: false,
        output: '/nonexistent/output',
        quality: 80,
      });

      // Then: ディレクトリが作成される
      expect(mockFileSystem.mkdir).toHaveBeenCalledWith('/nonexistent/output');
    });

    // 出力ディレクトリが既に存在する場合は mkdir を呼ばないテスト
    it('出力先ディレクトリが既に存在する場合は mkdir を呼ばない', async () => {
      // Given: 入力ファイルと出力先ディレクトリの両方が存在する
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        // 入力ファイル: /images/photo.png
        // 出力先ディレクトリ: /output
        // 出力ファイル: /output/photo.webp（存在しない）
        return path === '/images/photo.png' || path === '/output';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2048 });
      vi.mocked(mockImageProcessor.convertToWebP).mockResolvedValue({ size: 1024 });

      // When: 既に存在する出力先を指定して変換を実行する
      await converter.convert('/images/photo.png', {
        force: false,
        output: '/output',
        quality: 80,
      });

      // Then: mkdir は呼ばれない
      expect(mockFileSystem.mkdir).not.toHaveBeenCalled();
    });

    // 品質パラメータが正しく渡されるテスト
    it('品質パラメータが ImageProcessor に正しく渡される', async () => {
      // Given: 入力ファイルが存在し、出力ファイルは存在しない
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        return path === '/images/photo.png' || path === '/images';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2048 });
      vi.mocked(mockImageProcessor.convertToWebP).mockResolvedValue({ size: 1024 });

      // When: 品質 90 で変換を実行する
      await converter.convert('/images/photo.png', {
        force: false,
        quality: 90,
      });

      // Then: 品質パラメータが正しく渡される
      expect(mockImageProcessor.convertToWebP).toHaveBeenCalledWith('/images/photo.png', '/images/photo.webp', {
        quality: 90,
      });
    });

    // 複数の拡張子を持つファイルの処理テスト
    it('複数のドットを含むファイル名でも正しく処理する', async () => {
      // Given: 複数のドットを含むファイル名で、入力ファイルが存在し出力ファイルは存在しない
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        return path === '/images/photo.backup.png' || path === '/images';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2048 });
      vi.mocked(mockImageProcessor.convertToWebP).mockResolvedValue({ size: 1024 });

      // When: 変換を実行する
      const result = await converter.convert('/images/photo.backup.png', {
        force: false,
        quality: 80,
      });

      // Then: 最後の拡張子のみが置換される
      expect(result.outputPath).toBe('/images/photo.backup.webp');
    });

    // 既存ファイルが存在する場合のスキップテスト（Requirement 5.1）
    it('出力先に同名ファイルが存在する場合はスキップする', async () => {
      // Given: 入力ファイルと出力ファイルの両方が存在する
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        // 入力ファイル: /images/photo.png
        // 出力ファイル: /images/photo.webp（既に存在）
        return path === '/images/photo.png' || path === '/images/photo.webp' || path === '/images';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2048 });

      // When: force: false で変換を実行する
      const result = await converter.convert('/images/photo.png', {
        force: false,
        quality: 80,
      });

      // Then: スキップされ、変換処理は呼ばれない
      expect(result.skipped).toBe(true);
      expect(result.inputPath).toBe('/images/photo.png');
      expect(result.outputPath).toBe('/images/photo.webp');
      expect(mockImageProcessor.convertToWebP).not.toHaveBeenCalled();
    });

    // force オプションによる上書きテスト（Requirement 5.2）
    it('force オプションが true の場合は既存ファイルを上書きする', async () => {
      // Given: 入力ファイルと出力ファイルの両方が存在する
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        return path === '/images/photo.png' || path === '/images/photo.webp' || path === '/images';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2048 });
      vi.mocked(mockImageProcessor.convertToWebP).mockResolvedValue({ size: 1024 });

      // When: force: true で変換を実行する
      const result = await converter.convert('/images/photo.png', {
        force: true,
        quality: 80,
      });

      // Then: スキップされず、変換処理が実行される
      expect(result.skipped).toBe(false);
      expect(mockImageProcessor.convertToWebP).toHaveBeenCalledWith('/images/photo.png', '/images/photo.webp', {
        quality: 80,
      });
    });

    // ファイル不存在エラーテスト（Requirement 1.4）
    it('入力ファイルが存在しない場合はエラーを返す', async () => {
      // Given: 入力ファイルが存在しない
      vi.mocked(mockFileSystem.exists).mockResolvedValue(false);

      // When: 変換を実行する
      const result = await converter.convert('/images/nonexistent.png', {
        force: false,
        quality: 80,
      });

      // Then: エラー結果が返される
      expect(result.skipped).toBe(false);
      expect(result.error).toBe('File not found: /images/nonexistent.png');
      expect(result.inputSize).toBe(0);
      expect(result.outputSize).toBe(0);
      expect(mockImageProcessor.convertToWebP).not.toHaveBeenCalled();
    });

    // サポート外形式エラーテスト（Requirement 1.5）
    it('サポート外の形式の場合はエラーを返す', async () => {
      // Given: サポート外の形式のファイルが存在する
      vi.mocked(mockFileSystem.exists).mockResolvedValue(true);

      // When: BMP ファイルの変換を実行する
      const result = await converter.convert('/images/photo.bmp', {
        force: false,
        quality: 80,
      });

      // Then: エラー結果が返される
      expect(result.skipped).toBe(false);
      expect(result.error).toBe('Unsupported format: bmp. Supported: png, jpeg, jpg, gif');
      expect(result.inputSize).toBe(0);
      expect(result.outputSize).toBe(0);
      expect(mockImageProcessor.convertToWebP).not.toHaveBeenCalled();
    });

    // 画像処理エラーのハンドリングテスト
    it('画像処理中にエラーが発生した場合はエラー結果を返す', async () => {
      // Given: 入力ファイルは存在するが出力ファイルは存在せず、画像処理でエラーが発生する
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        return path === '/images/corrupted.png' || path === '/images';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2048 });
      vi.mocked(mockImageProcessor.convertToWebP).mockRejectedValue(new Error('Corrupted image file'));

      // When: 変換を実行する
      const result = await converter.convert('/images/corrupted.png', {
        force: false,
        quality: 80,
      });

      // Then: エラー結果が返される
      expect(result.skipped).toBe(false);
      expect(result.error).toBe('Image processing failed: Corrupted image file');
      expect(result.inputPath).toBe('/images/corrupted.png');
      expect(result.outputSize).toBe(0);
    });

    // Error 以外のオブジェクトがスローされた場合のハンドリングテスト
    it('Error 以外のオブジェクトがスローされた場合も適切にハンドリングする', async () => {
      // Given: 入力ファイルは存在するが出力ファイルは存在せず、文字列がスローされる
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        return path === '/images/corrupted.png' || path === '/images';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2048 });
      vi.mocked(mockImageProcessor.convertToWebP).mockRejectedValue('Unknown error');

      // When: 変換を実行する
      const result = await converter.convert('/images/corrupted.png', {
        force: false,
        quality: 80,
      });

      // Then: エラー結果が返される（文字列に変換されて表示）
      expect(result.skipped).toBe(false);
      expect(result.error).toBe('Image processing failed: Unknown error');
      expect(result.inputPath).toBe('/images/corrupted.png');
      expect(result.outputSize).toBe(0);
    });
  });

  describe('convertBatch', () => {
    // 複数ファイルの一括変換テスト（Requirement 4.1, 4.3, 7.2）
    it('複数ファイルを一括変換して統計情報を返す', async () => {
      // Given: 3つのファイルが存在し、すべて変換可能
      const inputPaths = ['/images/photo1.png', '/images/photo2.jpg', '/images/photo3.gif'];

      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        // 入力ファイルとディレクトリは存在、出力ファイルは存在しない
        return (
          inputPaths.includes(path) ||
          path === '/images/photo1.webp' ||
          path === '/images/photo2.webp' ||
          path === '/images/photo3.webp' ||
          path === '/images'
        );
      });
      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        return inputPaths.includes(path) || path === '/images';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2000 });
      vi.mocked(mockImageProcessor.convertToWebP).mockResolvedValue({ size: 1000 });

      // When: バッチ変換を実行する
      const stats = await converter.convertBatch(inputPaths, { force: false, quality: 80 });

      // Then: 統計情報が正しく集計される
      expect(stats.totalFiles).toBe(3);
      expect(stats.successCount).toBe(3);
      expect(stats.skippedCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.totalInputSize).toBe(6000); // 2000 * 3
      expect(stats.totalOutputSize).toBe(3000); // 1000 * 3
    });

    // 進捗コールバックが正しく呼び出されるテスト
    it('進捗コールバックが各ファイルの変換後に呼び出される', async () => {
      // Given: 2つのファイルが存在する
      const inputPaths = ['/images/photo1.png', '/images/photo2.jpg'];
      const progressCallback = vi.fn();

      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        return inputPaths.includes(path) || path === '/images';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2000 });
      vi.mocked(mockImageProcessor.convertToWebP).mockResolvedValue({ size: 1000 });

      // When: コールバック付きでバッチ変換を実行する
      await converter.convertBatch(inputPaths, { force: false, quality: 80 }, progressCallback);

      // Then: コールバックが各ファイルに対して呼び出される
      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ inputPath: '/images/photo1.png' }),
        0,
        2,
      );
      expect(progressCallback).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ inputPath: '/images/photo2.jpg' }),
        1,
        2,
      );
    });

    // スキップと成功が混在するケースのテスト
    it('スキップされたファイルと成功したファイルが正しくカウントされる', async () => {
      // Given: 2つのファイルのうち1つは既に出力ファイルが存在する
      const inputPaths = ['/images/photo1.png', '/images/photo2.jpg'];

      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        // photo1.webp は存在、photo2.webp は存在しない
        return inputPaths.includes(path) || path === '/images/photo1.webp' || path === '/images';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2000 });
      vi.mocked(mockImageProcessor.convertToWebP).mockResolvedValue({ size: 1000 });

      // When: バッチ変換を実行する
      const stats = await converter.convertBatch(inputPaths, { force: false, quality: 80 });

      // Then: スキップと成功が正しくカウントされる
      expect(stats.totalFiles).toBe(2);
      expect(stats.successCount).toBe(1);
      expect(stats.skippedCount).toBe(1);
      expect(stats.errorCount).toBe(0);
    });

    // エラーが発生するファイルがある場合のテスト
    it('エラーが発生したファイルはエラーとしてカウントされる', async () => {
      // Given: 2つのファイルのうち1つは変換に失敗する
      const inputPaths = ['/images/photo1.png', '/images/corrupted.png'];

      vi.mocked(mockFileSystem.exists).mockImplementation(async (path) => {
        return inputPaths.includes(path) || path === '/images';
      });
      vi.mocked(mockFileSystem.stat).mockResolvedValue({ size: 2000 });
      vi.mocked(mockImageProcessor.convertToWebP).mockImplementation(async (inputPath) => {
        if (inputPath === '/images/corrupted.png') {
          throw new Error('Corrupted image');
        }
        return { size: 1000 };
      });

      // When: バッチ変換を実行する
      const stats = await converter.convertBatch(inputPaths, { force: false, quality: 80 });

      // Then: エラーが正しくカウントされる
      expect(stats.totalFiles).toBe(2);
      expect(stats.successCount).toBe(1);
      expect(stats.skippedCount).toBe(0);
      expect(stats.errorCount).toBe(1);
    });

    // 空の配列の場合のテスト
    it('空の配列を渡した場合はゼロの統計情報を返す', async () => {
      // Given: 空のファイルリスト

      // When: バッチ変換を実行する
      const stats = await converter.convertBatch([], { force: false, quality: 80 });

      // Then: すべてゼロの統計情報が返される
      expect(stats.totalFiles).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.skippedCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.totalInputSize).toBe(0);
      expect(stats.totalOutputSize).toBe(0);
    });
  });
});
