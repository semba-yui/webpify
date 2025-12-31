/**
 * 画像処理ポートインターフェース
 * sharp などの画像処理ライブラリを抽象化し、テスト時にモック注入を可能にする
 */
export interface ImageProcessorPort {
  /**
   * 画像を WebP 形式に変換する
   * @param inputPath 入力ファイルパス
   * @param outputPath 出力ファイルパス
   * @param options 変換オプション
   * @returns 変換後のファイルサイズ情報
   */
  convertToWebP(inputPath: string, outputPath: string, options: { quality: number }): Promise<{ size: number }>;

  /**
   * 画像のメタデータを取得する
   * @param filePath ファイルパス
   * @returns 画像の幅、高さ、フォーマット
   */
  getMetadata(filePath: string): Promise<{ width: number; height: number; format: string }>;
}
