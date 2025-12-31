/**
 * CLI の E2E テスト
 * 実際の CLI コマンドを実行して動作を確認する
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * CLI を実行するヘルパー関数
 */
async function runCli(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const cliPath = path.join(import.meta.dirname, '../../dist/index.js');
    const proc = spawn('node', [cliPath, ...args]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ exitCode: code ?? 0, stderr, stdout });
    });

    proc.on('error', reject);
  });
}

describe('CLI E2E', () => {
  const fixturesDir = path.join(import.meta.dirname, '../fixtures');
  const outputDir = path.join(import.meta.dirname, '../e2e-output');

  beforeAll(async () => {
    // 出力ディレクトリを作成
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterAll(async () => {
    // 出力ディレクトリをクリーンアップ
    await fs.rm(outputDir, { force: true, recursive: true });
  });

  describe('ヘルプとバージョン', () => {
    // --help オプションでヘルプが表示されることをテスト（Requirement 6.1）
    it('--help オプションでヘルプが表示される', async () => {
      // When: --help オプションで実行
      const { stdout, exitCode } = await runCli(['--help']);

      // Then: ヘルプが表示され、終了コードは 0
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('--quality');
      expect(stdout).toContain('--output');
      expect(stdout).toContain('--recursive');
      expect(stdout).toContain('--force');
      expect(stdout).toContain('--quiet');
      expect(stdout).toContain('--list');
      expect(exitCode).toBe(0);
    });

    // -h オプションでヘルプが表示されることをテスト
    it('-h オプションでヘルプが表示される', async () => {
      // When: -h オプションで実行
      const { stdout, exitCode } = await runCli(['-h']);

      // Then: ヘルプが表示される
      expect(stdout).toContain('Usage:');
      expect(exitCode).toBe(0);
    });

    // --version オプションでバージョンが表示されることをテスト（Requirement 6.2）
    it('--version オプションでバージョンが表示される', async () => {
      // When: --version オプションで実行
      const { stdout, exitCode } = await runCli(['--version']);

      // Then: バージョンが表示され、終了コードは 0
      expect(stdout).toMatch(/\d+\.\d+\.\d+/);
      expect(exitCode).toBe(0);
    });

    // -v オプションでバージョンが表示されることをテスト
    it('-v オプションでバージョンが表示される', async () => {
      // When: -v オプションで実行
      const { stdout, exitCode } = await runCli(['-v']);

      // Then: バージョンが表示される
      expect(stdout).toMatch(/\d+\.\d+\.\d+/);
      expect(exitCode).toBe(0);
    });

    // 引数なしでヘルプが表示されることをテスト（Requirement 6.3）
    it('引数なしでヘルプが表示される', async () => {
      // When: 引数なしで実行
      const { stdout, exitCode } = await runCli([]);

      // Then: ヘルプが表示される
      expect(stdout).toContain('Usage:');
      expect(exitCode).toBe(0);
    });
  });

  describe('単一ファイル変換', () => {
    // 単一ファイルを変換できることをテスト（Requirement 1.1, 1.2）
    it('単一ファイルを WebP に変換できる', async () => {
      // Given: PNG 画像ファイル
      const inputPath = path.join(fixturesDir, 'sample.png');
      const singleOutputDir = path.join(outputDir, 'single');
      await fs.mkdir(singleOutputDir, { recursive: true });

      // When: 変換を実行
      const { stdout, exitCode } = await runCli([inputPath, '-o', singleOutputDir, '-q', '80', '-f']);

      // Then: 変換が成功し、出力ファイルが存在する
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Converted');
      expect(stdout).toContain('sample.png');

      const outputPath = path.join(singleOutputDir, 'sample.webp');
      const outputExists = await fs
        .stat(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(outputExists).toBe(true);
    });

    // 存在しないファイルでエラーが発生することをテスト（Requirement 1.4）
    it('存在しないファイルでエラーを表示する', async () => {
      // Given: 存在しないファイルパス
      const inputPath = path.join(fixturesDir, 'nonexistent.png');

      // When: 変換を試行
      const { stderr, exitCode } = await runCli([inputPath]);

      // Then: エラーが表示され、終了コードは 1
      expect(stderr).toContain('Error');
      expect(stderr).toContain('File not found');
      expect(exitCode).toBe(1);
    });
  });

  describe('ディレクトリ変換', () => {
    // ディレクトリ内のファイルを一括変換できることをテスト（Requirement 4.1）
    it('ディレクトリ内のファイルを一括変換できる', async () => {
      // Given: 画像ファイルを含むディレクトリ
      const batchOutputDir = path.join(outputDir, 'batch');
      await fs.mkdir(batchOutputDir, { recursive: true });

      // When: ディレクトリを変換
      const { stdout, exitCode } = await runCli([fixturesDir, '-o', batchOutputDir, '-f']);

      // Then: 変換が成功し、統計情報が表示される
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Converted');
      expect(stdout).toContain('Total files');
    });

    // --quiet オプションで出力が抑制されることをテスト（Requirement 7.3）
    it('--quiet オプションで出力が抑制される', async () => {
      // Given: 画像ファイル
      const inputPath = path.join(fixturesDir, 'sample.png');
      const quietOutputDir = path.join(outputDir, 'quiet');
      await fs.mkdir(quietOutputDir, { recursive: true });

      // When: --quiet オプション付きで変換
      const { stdout, exitCode } = await runCli([inputPath, '-o', quietOutputDir, '-f', '--quiet']);

      // Then: 出力が抑制される
      expect(exitCode).toBe(0);
      expect(stdout).toBe('');
    });
  });

  describe('品質設定', () => {
    // 品質パラメータを指定できることをテスト（Requirement 3.1）
    it('品質パラメータを指定して変換できる', async () => {
      // Given: PNG 画像ファイル
      const inputPath = path.join(fixturesDir, 'sample.png');
      const qualityOutputDir = path.join(outputDir, 'quality');
      await fs.mkdir(qualityOutputDir, { recursive: true });

      // When: 品質 50 で変換
      const { stdout, exitCode } = await runCli([inputPath, '-o', qualityOutputDir, '-q', '50', '-f']);

      // Then: 変換が成功
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Converted');
    });

    // 範囲外の品質値でエラーが発生することをテスト（Requirement 3.3）
    it('品質値が範囲外の場合エラーを表示する', async () => {
      // Given: PNG 画像ファイル
      const inputPath = path.join(fixturesDir, 'sample.png');

      // When: 範囲外の品質値で変換を試行
      const { stderr, exitCode } = await runCli([inputPath, '-q', '101']);

      // Then: エラーが表示される
      expect(stderr).toContain('Quality must be between 1 and 100');
      expect(exitCode).toBe(1);
    });
  });

  describe('上書き制御', () => {
    // 既存ファイルがスキップされることをテスト（Requirement 5.1）
    it('既存ファイルはデフォルトでスキップされる', async () => {
      // Given: 既に変換済みのファイル
      const inputPath = path.join(fixturesDir, 'sample.png');
      const skipOutputDir = path.join(outputDir, 'skip');
      await fs.mkdir(skipOutputDir, { recursive: true });

      // まず変換を実行
      await runCli([inputPath, '-o', skipOutputDir, '-f']);

      // When: 再度変換を試行（force なし）
      const { stdout, exitCode } = await runCli([inputPath, '-o', skipOutputDir]);

      // Then: スキップされる
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Skipped');
    });

    // --force オプションで上書きできることをテスト（Requirement 5.2）
    it('--force オプションで既存ファイルを上書きできる', async () => {
      // Given: 既に変換済みのファイル
      const inputPath = path.join(fixturesDir, 'sample.png');
      const forceOutputDir = path.join(outputDir, 'force');
      await fs.mkdir(forceOutputDir, { recursive: true });

      // まず変換を実行
      await runCli([inputPath, '-o', forceOutputDir, '-f']);

      // When: --force オプション付きで再度変換
      const { stdout, exitCode } = await runCli([inputPath, '-o', forceOutputDir, '-f']);

      // Then: 上書きされる
      expect(exitCode).toBe(0);
      expect(stdout).toContain('Converted');
    });
  });

  describe('WebP 一覧表示', () => {
    // WebP ファイルの一覧を表示できることをテスト（Requirement 8.1, 8.4）
    it('--list オプションで WebP ファイルの一覧を表示できる', async () => {
      // Given: WebP ファイルを含むディレクトリを作成
      const listOutputDir = path.join(outputDir, 'list');
      await fs.mkdir(listOutputDir, { recursive: true });

      // まず変換を実行して WebP ファイルを作成
      await runCli([path.join(fixturesDir, 'sample.png'), '-o', listOutputDir, '-f']);

      // When: --list オプションで実行
      const { stdout, exitCode } = await runCli(['--list', listOutputDir]);

      // Then: 一覧が表示される
      expect(exitCode).toBe(0);
      expect(stdout).toContain('sample.webp');
      expect(stdout).toContain('File');
      expect(stdout).toContain('Size');
      expect(stdout).toContain('Width');
      expect(stdout).toContain('Height');
    });

    // WebP ファイルがない場合のメッセージをテスト（Requirement 8.6）
    it('WebP ファイルがない場合はメッセージを表示する', async () => {
      // Given: 空のディレクトリ
      const emptyDir = path.join(outputDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      // When: --list オプションで実行
      const { stdout, exitCode } = await runCli(['--list', emptyDir]);

      // Then: メッセージが表示される
      expect(exitCode).toBe(0);
      expect(stdout).toContain('WebP ファイルが見つかりません');
    });
  });
});
