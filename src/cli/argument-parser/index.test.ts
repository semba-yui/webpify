import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createArgumentParser } from './index.js';

describe('ArgumentParser', () => {
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

  describe('parse', () => {
    // 基本的なファイルパスの指定ができること
    describe('Given 入力ファイルパスが指定された場合', () => {
      it('When parse を呼び出すと Then input プロパティにパスが設定される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.input).toBe('input.png');
      });
    });

    // デフォルト値が正しく設定されること
    describe('Given オプションが指定されていない場合', () => {
      it('When parse を呼び出すと Then デフォルト値が設定される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.quality).toBe(100);
        expect(result.recursive).toBe(false);
        expect(result.force).toBe(false);
        expect(result.quiet).toBe(false);
        expect(result.list).toBe(false);
        expect(result.output).toBeUndefined();
      });
    });

    // 出力先オプションの指定ができること
    describe('Given -o オプションが指定された場合', () => {
      it('When parse を呼び出すと Then output プロパティにパスが設定される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-o', 'output.webp'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.output).toBe('output.webp');
      });
    });

    describe('Given --output オプションが指定された場合', () => {
      it('When parse を呼び出すと Then output プロパティにパスが設定される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '--output', 'output.webp'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.output).toBe('output.webp');
      });
    });

    // 品質オプションの指定ができること
    describe('Given -q オプションが指定された場合', () => {
      it('When parse を呼び出すと Then quality プロパティに値が設定される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', '90'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.quality).toBe(90);
      });
    });

    describe('Given --quality オプションが指定された場合', () => {
      it('When parse を呼び出すと Then quality プロパティに値が設定される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '--quality', '50'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.quality).toBe(50);
      });
    });

    // 再帰オプションの指定ができること
    describe('Given -r オプションが指定された場合', () => {
      it('When parse を呼び出すと Then recursive が true になる', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', './images', '-r'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.recursive).toBe(true);
      });
    });

    describe('Given --recursive オプションが指定された場合', () => {
      it('When parse を呼び出すと Then recursive が true になる', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', './images', '--recursive'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.recursive).toBe(true);
      });
    });

    // 強制上書きオプションの指定ができること
    describe('Given -f オプションが指定された場合', () => {
      it('When parse を呼び出すと Then force が true になる', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-f'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.force).toBe(true);
      });
    });

    describe('Given --force オプションが指定された場合', () => {
      it('When parse を呼び出すと Then force が true になる', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '--force'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.force).toBe(true);
      });
    });

    // サイレントモードオプションの指定ができること
    describe('Given --quiet オプションが指定された場合', () => {
      it('When parse を呼び出すと Then quiet が true になる', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '--quiet'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.quiet).toBe(true);
      });
    });

    // 一覧表示オプションの指定ができること
    describe('Given --list オプションが指定された場合', () => {
      it('When parse を呼び出すと Then list が true になる', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', '--list', './images'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.list).toBe(true);
      });
    });

    // 複数オプションの組み合わせができること
    describe('Given 複数のオプションが組み合わせて指定された場合', () => {
      it('When parse を呼び出すと Then すべてのオプションが正しく設定される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', './images', '-o', './output', '-q', '75', '-r', '-f', '--quiet'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.input).toBe('./images');
        expect(result.output).toBe('./output');
        expect(result.quality).toBe(75);
        expect(result.recursive).toBe(true);
        expect(result.force).toBe(true);
        expect(result.quiet).toBe(true);
      });
    });
  });

  describe('showHelp', () => {
    // ヘルプメッセージが表示されること
    describe('Given ArgumentParser が作成された場合', () => {
      it('When showHelp を呼び出すと Then ヘルプメッセージが出力される', () => {
        // Given
        const parser = createArgumentParser();

        // When
        parser.showHelp();

        // Then
        expect(mockStdout).toHaveBeenCalled();
        const output = mockStdout.mock.calls.map((call) => call[0]).join('');
        expect(output).toContain('Usage:');
        expect(output).toContain('--quality');
        expect(output).toContain('--output');
        expect(output).toContain('--recursive');
        expect(output).toContain('--force');
        expect(output).toContain('--quiet');
        expect(output).toContain('--list');
        expect(output).toContain('--help');
        expect(output).toContain('--version');
      });
    });
  });

  describe('showVersion', () => {
    // バージョン情報が表示されること
    describe('Given ArgumentParser が作成された場合', () => {
      it('When showVersion を呼び出すと Then バージョン番号が出力される', () => {
        // Given
        const parser = createArgumentParser();

        // When
        parser.showVersion();

        // Then
        expect(mockStdout).toHaveBeenCalled();
        const output = mockStdout.mock.calls.map((call) => call[0]).join('');
        // バージョン番号の形式（例: 1.0.0）を確認
        expect(output).toMatch(/\d+\.\d+\.\d+/);
      });
    });
  });

  describe('--help オプション', () => {
    // -h オプションでヘルプが表示されること
    describe('Given -h オプションが指定された場合', () => {
      it('When parse を呼び出すと Then ヘルプが表示されて空の input を持つオプションが返される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', '-h'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(mockStdout).toHaveBeenCalled();
        const output = mockStdout.mock.calls.map((call) => call[0]).join('');
        expect(output).toContain('Usage:');
        expect(result.input).toBe('');
      });
    });

    describe('Given --help オプションが指定された場合', () => {
      it('When parse を呼び出すと Then ヘルプが表示されて空の input を持つオプションが返される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', '--help'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(mockStdout).toHaveBeenCalled();
        expect(result.input).toBe('');
      });
    });
  });

  describe('--version オプション', () => {
    // -v オプションでバージョンが表示されること
    describe('Given -v オプションが指定された場合', () => {
      it('When parse を呼び出すと Then バージョンが表示されて空の input を持つオプションが返される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', '-v'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(mockStdout).toHaveBeenCalled();
        const output = mockStdout.mock.calls.map((call) => call[0]).join('');
        expect(output).toMatch(/\d+\.\d+\.\d+/);
        expect(result.input).toBe('');
      });
    });

    describe('Given --version オプションが指定された場合', () => {
      it('When parse を呼び出すと Then バージョンが表示されて空の input を持つオプションが返される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', '--version'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(mockStdout).toHaveBeenCalled();
        expect(result.input).toBe('');
      });
    });
  });

  describe('引数なしの場合', () => {
    // 引数なしでヘルプが表示されること
    describe('Given 引数なしで実行された場合', () => {
      it('When parse を呼び出すと Then ヘルプが表示される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify'];

        // When
        parser.parse(argv);

        // Then
        expect(mockStdout).toHaveBeenCalled();
        const output = mockStdout.mock.calls.map((call) => call[0]).join('');
        expect(output).toContain('Usage:');
      });
    });
  });

  describe('品質値のバリデーション', () => {
    // 品質値が 0 以下の場合にエラーになること
    describe('Given 品質値が 0 の場合', () => {
      it('When parse を呼び出すと Then エラーメッセージが表示されて終了コード 1 で終了する', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', '0'];

        // When
        parser.parse(argv);

        // Then
        expect(mockStderr).toHaveBeenCalled();
        const output = mockStderr.mock.calls.map((call) => call[0]).join('');
        expect(output).toContain('Quality must be between 1 and 100');
        expect(mockExit).toHaveBeenCalledWith(1);
      });
    });

    describe('Given 品質値が負の数の場合', () => {
      it('When parse を呼び出すと Then エラーメッセージが表示されて終了コード 1 で終了する', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', '-10'];

        // When
        parser.parse(argv);

        // Then
        expect(mockStderr).toHaveBeenCalled();
        const output = mockStderr.mock.calls.map((call) => call[0]).join('');
        expect(output).toContain('Quality must be between 1 and 100');
        expect(mockExit).toHaveBeenCalledWith(1);
      });
    });

    // 品質値が 101 以上の場合にエラーになること
    describe('Given 品質値が 101 の場合', () => {
      it('When parse を呼び出すと Then エラーメッセージが表示されて終了コード 1 で終了する', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', '101'];

        // When
        parser.parse(argv);

        // Then
        expect(mockStderr).toHaveBeenCalled();
        const output = mockStderr.mock.calls.map((call) => call[0]).join('');
        expect(output).toContain('Quality must be between 1 and 100');
        expect(mockExit).toHaveBeenCalledWith(1);
      });
    });

    describe('Given 品質値が 1000 の場合', () => {
      it('When parse を呼び出すと Then エラーメッセージが表示されて終了コード 1 で終了する', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', '1000'];

        // When
        parser.parse(argv);

        // Then
        expect(mockStderr).toHaveBeenCalled();
        const output = mockStderr.mock.calls.map((call) => call[0]).join('');
        expect(output).toContain('Quality must be between 1 and 100');
        expect(mockExit).toHaveBeenCalledWith(1);
      });
    });

    // 品質値が有効な範囲（1-100）の場合は正常に処理されること
    describe('Given 品質値が 1 の場合', () => {
      it('When parse を呼び出すと Then quality が 1 として設定される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', '1'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.quality).toBe(1);
        expect(mockExit).not.toHaveBeenCalledWith(1);
      });
    });

    describe('Given 品質値が 100 の場合', () => {
      it('When parse を呼び出すと Then quality が 100 として設定される', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', '100'];

        // When
        const result = parser.parse(argv);

        // Then
        expect(result.quality).toBe(100);
        expect(mockExit).not.toHaveBeenCalledWith(1);
      });
    });

    // 品質値が数値ではない場合にエラーになること
    describe('Given 品質値が数値ではない場合', () => {
      it('When parse を呼び出すと Then エラーメッセージが表示されて終了コード 1 で終了する', () => {
        // Given
        const parser = createArgumentParser();
        const argv = ['node', 'webpify', 'input.png', '-q', 'abc'];

        // When
        parser.parse(argv);

        // Then
        expect(mockStderr).toHaveBeenCalled();
        const output = mockStderr.mock.calls.map((call) => call[0]).join('');
        expect(output).toContain('Quality must be between 1 and 100');
        expect(mockExit).toHaveBeenCalledWith(1);
      });
    });
  });
});
