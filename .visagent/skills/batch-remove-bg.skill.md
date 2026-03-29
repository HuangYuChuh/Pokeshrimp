---
name: 批量去背景
description: 批量移除图片背景，输出透明 PNG
command: /batch-remove-bg
requiredTools:
  - bg-remove-server
inputParams:
  - name: input_dir
    type: string
    description: 输入图片目录
  - name: output_format
    type: string
    default: png
    description: 输出图片格式
outputs:
  - type: image/png
    description: 去背景后的透明图片
---

## 执行步骤

### Step 1: 扫描输入目录
读取 input_dir 中所有图片文件（jpg, png, webp）。

### Step 2: 逐张去背景
对每张图片调用 bg-remove-server 的 remove_background 工具。

### Step 3: 保存结果
将处理后的图片保存到输出目录，文件名保持原名，格式为 output_format。
