/**
 * ファイルシステムポートインターフェース
 * Node.js fs モジュールを抽象化し、テスト時にモック注入を可能にする
 */
export interface FileSystemPort {
  /**
   * パスが存在するか確認する
   * @param path ファイルまたはディレクトリのパス
   */
  exists(path: string): Promise<boolean>;

  /**
   * パスがディレクトリかどうか確認する
   * @param path パス
   */
  isDirectory(path: string): Promise<boolean>;

  /**
   * ディレクトリ内のファイル一覧を取得する
   * @param path ディレクトリパス
   */
  readDir(path: string): Promise<string[]>;

  /**
   * ディレクトリ内のファイルを再帰的に取得する
   * @param path ディレクトリパス
   */
  readDirRecursive(path: string): Promise<string[]>;

  /**
   * ディレクトリを作成する（再帰的）
   * @param path ディレクトリパス
   */
  mkdir(path: string): Promise<void>;

  /**
   * ファイルの統計情報を取得する
   * @param path ファイルパス
   */
  stat(path: string): Promise<{ size: number }>;
}
