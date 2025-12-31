/**
 * テスト用画像ファイルを生成するスクリプト
 * 実行: pnpm exec ts-node tests/fixtures/create-fixtures.ts
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createFixtures(): Promise<void> {
  // 100x100 の赤い PNG 画像を生成
  await sharp({
    create: {
      background: { b: 0, g: 0, r: 255 },
      channels: 3,
      height: 100,
      width: 100,
    },
  })
    .png()
    .toFile(path.join(__dirname, 'sample.png'));

  // 100x100 の青い JPEG 画像を生成
  await sharp({
    create: {
      background: { b: 255, g: 0, r: 0 },
      channels: 3,
      height: 100,
      width: 100,
    },
  })
    .jpeg({ quality: 90 })
    .toFile(path.join(__dirname, 'sample.jpg'));

  // 100x100 の緑の GIF 画像を生成
  await sharp({
    create: {
      background: { b: 0, g: 255, r: 0 },
      channels: 3,
      height: 100,
      width: 100,
    },
  })
    .gif()
    .toFile(path.join(__dirname, 'sample.gif'));

  console.log('Test fixtures created successfully');
}

createFixtures().catch(console.error);
