/**
 * ArgumentParser のプロパティベースドテスト
 *
 * プロパティベースドテストは、ランダムなテストデータを自動生成して
 * 不変条件（プロパティ）が常に満たされることを検証する。
 */
import { fc, test } from '@fast-check/vitest';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { createArgumentParser } from './index.js';

describe('ArgumentParser - Property Based Tests', () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let mockStdout: ReturnType<typeof vi.spyOn>;
  let mockStderr: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // プロセス終了とコンソール出力をモック化
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    mockStdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    mockStderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockStdout.mockRestore();
    mockStderr.mockRestore();
  });

  describe('品質値の範囲検証', () => {
    /**
     * プロパティ: 有効な品質値（1-100）の受け入れ
     *
     * 不変条件: forall q in [1, 100]:
     *   parse(['node', 'webpify', 'input.png', '-q', q]).quality === q
     */
    test.prop([fc.integer({ max: 100, min: 1 })])(
      'Given 有効な品質値（1-100）When parse を呼び出す Then エラーなしでその値が設定される',
      (quality) => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', String(quality)];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.quality).toBe(quality);
        expect(mockExit).not.toHaveBeenCalledWith(1);
      },
    );

    /**
     * プロパティ: 下限未満の品質値の拒否
     *
     * 不変条件: forall q <= 0:
     *   parse(['node', 'webpify', 'input.png', '-q', q]) triggers exit(1)
     */
    test.prop([fc.integer({ max: 0 })])(
      'Given 無効な品質値（0以下）When parse を呼び出す Then エラーで終了する',
      (quality) => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', String(quality)];

        // When
        parser.parse(argv);

        // Then
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(mockStderr).toHaveBeenCalled();
      },
    );

    /**
     * プロパティ: 上限超過の品質値の拒否
     *
     * 不変条件: forall q >= 101:
     *   parse(['node', 'webpify', 'input.png', '-q', q]) triggers exit(1)
     */
    test.prop([fc.integer({ max: 10000, min: 101 })])(
      'Given 無効な品質値（101以上）When parse を呼び出す Then エラーで終了する',
      (quality) => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', String(quality)];

        // When
        parser.parse(argv);

        // Then
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(mockStderr).toHaveBeenCalled();
      },
    );
  });

  describe('オプションの組み合わせ', () => {
    /**
     * プロパティ: Boolean オプションの独立性
     *
     * 不変条件: 各 Boolean オプションは他のオプションに影響を与えない
     */
    test.prop([fc.boolean(), fc.boolean(), fc.boolean(), fc.boolean()])(
      'Given Boolean オプションの任意の組み合わせ When parse を呼び出す Then 各オプションが独立して設定される',
      (recursive, force, quiet, list) => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png'];

        if (recursive) argv.push('-r');
        if (force) argv.push('-f');
        if (quiet) argv.push('--quiet');
        if (list) argv.push('--list');

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.recursive).toBe(recursive);
        expect(result.force).toBe(force);
        expect(result.quiet).toBe(quiet);
        expect(result.list).toBe(list);
      },
    );

    /**
     * プロパティ: 品質値と Boolean オプションの組み合わせ
     *
     * 不変条件: 品質値と Boolean オプションは相互に影響しない
     */
    test.prop([fc.integer({ max: 100, min: 1 }), fc.boolean(), fc.boolean()])(
      'Given 品質値と Boolean オプションの組み合わせ When parse を呼び出す Then すべてが正しく設定される',
      (quality, recursive, force) => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', String(quality)];

        if (recursive) argv.push('-r');
        if (force) argv.push('-f');

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.quality).toBe(quality);
        expect(result.recursive).toBe(recursive);
        expect(result.force).toBe(force);
      },
    );
  });

  describe('入力パスの保持', () => {
    /**
     * プロパティ: 入力パスの保持
     *
     * 不変条件: 入力パスは常にそのまま保持される
     */
    // 有効なファイルパス文字列を生成する Arbitrary
    const filePathArb = fc
      .tuple(
        fc.stringMatching(/^[a-zA-Z0-9_-]+$/), // ディレクトリ名
        fc.stringMatching(/^[a-zA-Z0-9_-]+$/), // ファイル名
        fc.constantFrom('png', 'jpg', 'jpeg', 'gif'), // 拡張子
      )
      .filter(([dir, name]) => dir.length > 0 && name.length > 0)
      .map(([dir, name, ext]) => `./${dir}/${name}.${ext}`);

    test.prop([filePathArb])(
      'Given 任意の有効なファイルパス When parse を呼び出す Then input プロパティにそのパスが設定される',
      (filePath) => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', filePath];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.input).toBe(filePath);
      },
    );

    /**
     * プロパティ: 出力パスの保持
     *
     * 不変条件: 出力パスが指定された場合、そのまま保持される
     */
    test.prop([filePathArb, filePathArb])(
      'Given 入力パスと出力パス When parse を呼び出す Then 両方のパスが正しく設定される',
      (inputPath, outputPath) => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', inputPath, '-o', outputPath];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.input).toBe(inputPath);
        expect(result.output).toBe(outputPath);
      },
    );
  });

  describe('デフォルト値の保証', () => {
    /**
     * プロパティ: オプション未指定時のデフォルト値
     *
     * 不変条件: オプションを指定しない場合、デフォルト値が設定される
     */
    // 有効なファイル名を生成（ハイフンで始まらない）
    const fileNameArb = fc
      .stringMatching(/^[a-zA-Z0-9_][a-zA-Z0-9_-]*$/)
      .filter((s) => s.length > 0)
      .map((name) => `${name}.png`);

    test.prop([fileNameArb])(
      'Given オプションなしで入力パスのみ指定 When parse を呼び出す Then デフォルト値が設定される',
      (fileName) => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', fileName];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.quality).toBe(100); // デフォルト品質
        expect(result.recursive).toBe(false);
        expect(result.force).toBe(false);
        expect(result.quiet).toBe(false);
        expect(result.list).toBe(false);
        expect(result.output).toBeUndefined();
      },
    );
  });
});
