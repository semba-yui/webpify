#!/usr/bin/env node

import { createFsAdapter, createSharpAdapter } from './adapters/index.js';
import { createArgumentParser, createMain, createReporter } from './cli/index.js';
import { createConverter, createFileScanner, createImageInspector } from './core/index.js';

/**
 * エントリポイント
 * 依存性を組み立てて、メイン処理を実行する
 */
async function main(): Promise<void> {
  // アダプターの生成
  const fsAdapter = createFsAdapter();
  const sharpAdapter = createSharpAdapter();

  // コアコンポーネントの生成
  const converter = createConverter({
    fileSystem: fsAdapter,
    imageProcessor: sharpAdapter,
  });

  const fileScanner = createFileScanner({
    fileSystem: fsAdapter,
  });

  const imageInspector = createImageInspector({
    fileSystem: fsAdapter,
    imageProcessor: sharpAdapter,
  });

  // CLI コンポーネントの生成
  const argumentParser = createArgumentParser();
  const reporter = createReporter();

  // メインサービスの生成と実行
  const mainService = createMain({
    argumentParser,
    converter,
    fileScanner,
    imageInspector,
    reporter,
  });

  const exitCode = await mainService.run(process.argv);
  process.exit(exitCode);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Fatal error: ${message}\n`);
  process.exit(1);
});
