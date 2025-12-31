import fs from 'node:fs/promises';
import path from 'node:path';
import type { FileSystemPort } from '../../ports/file-system.js';

/**
 * Node.js fs モジュールを使用した FileSystemPort の実装
 * ファイル操作とディレクトリ走査機能を提供する
 */
export function createFsAdapter(): FileSystemPort {
  return {
    async exists(filePath: string): Promise<boolean> {
      try {
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    },

    async isDirectory(filePath: string): Promise<boolean> {
      try {
        const stat = await fs.stat(filePath);
        return stat.isDirectory();
      } catch {
        return false;
      }
    },

    async mkdir(dirPath: string): Promise<void> {
      await fs.mkdir(dirPath, { recursive: true });
    },

    async readDir(dirPath: string): Promise<string[]> {
      return await fs.readdir(dirPath);
    },

    async readDirRecursive(dirPath: string): Promise<string[]> {
      const result: string[] = [];

      async function traverse(currentPath: string): Promise<void> {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          if (entry.isDirectory()) {
            await traverse(fullPath);
          } else {
            result.push(fullPath);
          }
        }
      }

      await traverse(dirPath);
      return result;
    },

    async stat(filePath: string): Promise<{ size: number }> {
      const stat = await fs.stat(filePath);
      return { size: stat.size };
    },
  };
}
