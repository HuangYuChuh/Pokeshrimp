---
name: 批量去背景
command: /remove-bg
description: 使用 rembg 命令行工具批量移除图片背景，输出透明 PNG
requiredCLI: rembg
---

## 安装

```bash
pip install rembg[cli]
```

## 单张图片去背景

```bash
rembg i input.png output.png
```

## 批量处理整个目录

```bash
rembg p input_dir/ output_dir/
```

自动处理目录中所有图片（jpg, png, webp），输出为透明 PNG。

## 常用参数

- `-m <model>` — 选择模型，默认 `u2net`，可选 `isnet-general-use`（更精细）
- `-a` — 返回带 alpha 通道的结果（默认行为）
- `-ae <size>` — 自动裁切到内容边界并扩展指定像素
- `-om` — 只输出遮罩（黑白蒙版），不输出原图

## 使用场景

### 电商白底图

```bash
# 去背景
rembg i product.jpg product_nobg.png

# 加白底（配合 ImageMagick）
magick product_nobg.png -background white -flatten product_white.png
```

### 批量处理产品图

```bash
rembg p ./raw_photos/ ./processed/ -m isnet-general-use
```

## 注意事项

- 第一次运行会自动下载模型（约 170MB）
- 对复杂边缘（头发、透明物体）效果有限，建议用 `isnet-general-use` 模型
- 输出始终为 PNG 格式（需要 alpha 通道）
