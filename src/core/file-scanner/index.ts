import path from 'node:path';
import type { FileSystemPort } from '../../ports/file-system.js';
import type { ScanOptions } from '../../types/index.js';

/**
 * FileScanner の依存性
 */
export interface FileScannerDependencies {
  fileSystem: FileSystemPort;
}

/**
 * FileScanner サービスインターフェース
 */
export interface FileScannerService {
  /**
   * 指定されたディレクトリ内のファイルをスキャンする
   * @param directoryPath ディレクトリパス
   * @param options スキャンオプション
   * @returns マッチしたファイルパスの配列
   */
  scan(directoryPath: string, options: ScanOptions): Promise<string[]>;

  /**
   * パスがディレクトリかどうか判定する
   * @param filePath パス
   */
  isDirectory(filePath: string): Promise<boolean>;

  /**
   * パスが存在するか確認する
   * @param filePath パス
   */
  exists(filePath: string): Promise<boolean>;
}

/**
 * FileScanner を生成するファクトリ関数
 * @param deps 依存性
 * @returns FileScannerService インスタンス
 */
export function createFileScanner(deps: FileScannerDependencies): FileScannerService {
  const { fileSystem } = deps;

  /**
   * 拡張子がマッチするかチェックする（大文字小文字を区別しない）
   */
  function matchesExtension(fileName: string, extensions: string[]): boolean {
    const ext = path.extname(fileName).slice(1).toLowerCase();
    return extensions.map((e) => e.toLowerCase()).includes(ext);
  }

  return {
    async exists(filePath: string): Promise<boolean> {
      return fileSystem.exists(filePath);
    },

    async isDirectory(filePath: string): Promise<boolean> {
      return fileSystem.isDirectory(filePath);
    },
    async scan(directoryPath: string, options: ScanOptions): Promise<string[]> {
      const { recursive, extensions } = options;

      if (recursive) {
        // 再帰モード: readDirRecursive で全ファイルを取得（フルパスが返る）
        const allFiles = await fileSystem.readDirRecursive(directoryPath);
        return allFiles.filter((filePath) => matchesExtension(filePath, extensions));
      } else {
        // 非再帰モード: readDir でファイル名のみ取得
        const fileNames = await fileSystem.readDir(directoryPath);
        return fileNames
          .filter((fileName) => matchesExtension(fileName, extensions))
          .map((fileName) => path.join(directoryPath, fileName));
      }
    },
  };
}
