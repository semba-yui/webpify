import { Command } from 'commander';
import type { ParsedOptions } from '../../types/index.js';

/**
 * ArgumentParser サービスのインターフェース
 */
export interface ArgumentParserService {
  /**
   * コマンドライン引数をパースする
   * @param argv - process.argv 形式の配列
   * @returns パースされたオプション
   */
  parse(argv: string[]): ParsedOptions;

  /**
   * ヘルプメッセージを表示する
   */
  showHelp(): void;

  /**
   * バージョン情報を表示する
   */
  showVersion(): void;
}

/**
 * デフォルトの品質値
 */
const DEFAULT_QUALITY = 100;

/**
 * 品質値の最小値
 */
const MIN_QUALITY = 1;

/**
 * 品質値の最大値
 */
const MAX_QUALITY = 100;

/**
 * パッケージのバージョン（package.json から取得できない場合のフォールバック）
 */
const VERSION = '1.0.0';

/**
 * 品質値をパースしてバリデーションするカスタムパーサー
 * @param value - ユーザーが入力した品質値（文字列）
 * @returns パースされた品質値
 * @throws 無効な品質値の場合はエラーをスロー
 */
function parseQuality(value: string): number {
  const quality = Number.parseInt(value, 10);

  if (Number.isNaN(quality) || quality < MIN_QUALITY || quality > MAX_QUALITY) {
    process.stderr.write(`エラー: 品質は ${MIN_QUALITY} から ${MAX_QUALITY} の間で指定してください\n`);
    process.exit(1);
  }

  return quality;
}

/**
 * ArgumentParser のファクトリ関数
 * @returns ArgumentParserService のインスタンス
 */
export function createArgumentParser(): ArgumentParserService {
  const program = new Command();

  program
    .name('webpify')
    .description('画像を WebP 形式に変換する CLI ツール')
    .version(VERSION, '-v, --version', 'バージョン番号を表示')
    .argument('[input]', '入力ファイルまたはディレクトリのパス')
    .option('-o, --output <path>', '出力パス')
    .option('-q, --quality <number>', '品質レベル (1-100)', parseQuality, DEFAULT_QUALITY)
    .option('-r, --recursive', 'ディレクトリを再帰的に処理', false)
    .option('-f, --force', '既存ファイルを上書き', false)
    .option('--quiet', 'サイレントモード（出力なし）', false)
    .option('--list', 'WebP ファイルをサイズ情報付きで一覧表示', false)
    .configureOutput({
      writeErr: (str) => process.stderr.write(str),
      writeOut: (str) => process.stdout.write(str),
    })
    .exitOverride();

  return {
    parse(argv: string[]): ParsedOptions {
      // 引数なしの場合はヘルプを表示
      if (argv.length <= 2) {
        program.outputHelp();
        return {
          force: false,
          input: '',
          list: false,
          quality: DEFAULT_QUALITY,
          quiet: false,
          recursive: false,
        };
      }

      try {
        program.parse(argv);
      } catch (err) {
        // exitOverride()により、--help/--version時に例外がスローされる
        // 例外をキャッチして正常終了を示す
        if (err instanceof Error && 'code' in err) {
          const code = (err as { code: string }).code;
          if (code === 'commander.helpDisplayed' || code === 'commander.version') {
            return {
              force: false,
              input: '',
              list: false,
              quality: DEFAULT_QUALITY,
              quiet: false,
              recursive: false,
            };
          }
        }
        throw err;
      }

      const options = program.opts();
      const args = program.args;

      return {
        force: options['force'] as boolean,
        input: args[0] || '',
        list: options['list'] as boolean,
        output: options['output'] as string | undefined,
        quality: options['quality'] as number,
        quiet: options['quiet'] as boolean,
        recursive: options['recursive'] as boolean,
      };
    },

    showHelp(): void {
      program.outputHelp();
    },

    showVersion(): void {
      process.stdout.write(`${VERSION}\n`);
    },
  };
}
