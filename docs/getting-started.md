# クイックスタート

このガイドでは、webpify のインストールから最初の画像変換までを説明します。

## 目次

- [前提条件](#前提条件)
- [インストール](#インストール)
- [はじめての変換](#はじめての変換)
  - [処理フロー](#処理フロー)
  - [単一ファイルを変換](#単一ファイルを変換)
- [基本的な使い方](#基本的な使い方)
  - [ディレクトリ一括変換](#ディレクトリ一括変換)
  - [品質を指定](#品質を指定)
  - [lossless（可逆圧縮）で変換](#lossless可逆圧縮で変換)
  - [出力先を指定](#出力先を指定)
  - [再帰的に変換](#再帰的に変換)
  - [オプションの組み合わせ](#オプションの組み合わせ)
- [ヘルプを表示](#ヘルプを表示)
- [次のステップ](#次のステップ)

## 前提条件

- **Node.js 22.0.0 以上**

バージョンを確認するには：

```bash
node --version
# v22.0.0 以上であること
```

## インストール

npm または pnpm を使ってグローバルにインストールします：

```bash
# pnpm の場合
pnpm add -g @semba-ryuichiro/webpify

# npm の場合
npm install -g @semba-ryuichiro/webpify
```

インストールを確認：

```bash
webpify --version
```

## はじめての変換

### 処理フロー

```mermaid
flowchart LR
    A[画像ファイル<br/>PNG/JPEG/GIF] --> B[webpify]
    B --> C[WebP ファイル]

    style A fill:#f9f,stroke:#333
    style B fill:#bbf,stroke:#333
    style C fill:#bfb,stroke:#333
```

### 単一ファイルを変換

PNG 画像を WebP に変換してみましょう：

```bash
webpify image.png
```

実行結果：

```
Converted: image.png (150.00 KB -> 45.00 KB, 70.0%)
```

変換後のファイル `image.webp` が同じディレクトリに作成されます。

## 基本的な使い方

### ディレクトリ一括変換

ディレクトリ内のすべての画像を一括変換：

```bash
webpify ./images
```

実行結果：

```
[1/3] Processing: photo1.png
[2/3] Processing: photo2.jpg
[3/3] Processing: banner.gif

--- Conversion Stats ---
Total files: 3
Converted: 3
Skipped: 0
Errors: 0
Total size reduction: 2.50 MB (65.0%)
```

### 品質を指定

品質レベル（1-100）を指定して変換：

```bash
# 品質 80 で変換（ファイルサイズと画質のバランス）
webpify image.png -q 80

# 品質 50 で変換（容量重視）
webpify ./images -q 50
```

### lossless（可逆圧縮）で変換

元の画像データを完全に保持したい場合は lossless モードを使用：

```bash
# lossless モードで変換（品質劣化なし）
webpify image.png --lossless

# ディレクトリを lossless で変換
webpify ./images --lossless
```

**注意**: lossless モードではファイルサイズが元より大きくなる場合があります。

### 出力先を指定

変換後のファイルを別のディレクトリに出力：

```bash
webpify ./images -o ./webp-output
```

### 再帰的に変換

サブディレクトリ内の画像も含めて変換：

```bash
webpify ./images -r
```

### オプションの組み合わせ

複数のオプションを組み合わせることもできます：

```bash
# 再帰 + 品質80 + 別ディレクトリに出力
webpify ./images -r -q 80 -o ./webp-output
```

## ヘルプを表示

利用可能なすべてのオプションを確認：

```bash
webpify --help
```

## 次のステップ

- [コマンドリファレンス](./cli-reference.md) - すべてのオプションの詳細
- [ユースケース集](./use-cases.md) - 実践的な使用例
- [README](../README.md) - プロジェクト概要に戻る
