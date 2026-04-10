---
name: ComfyUI 图像生成
command: /comfyui
description: 使用 ComfyUI Skill CLI 管理和执行 ComfyUI 工作流，生成图像、音频、视频
requiredCLI: comfyui-skill
---

## 安装

```bash
pipx install comfyui-skill-cli
```

需要一个运行中的 ComfyUI 服务器（默认 http://127.0.0.1:8188）。

## 重要：工作目录

所有命令必须在包含 `config.json` 和 `data/` 目录的项目目录中执行。如果不在正确目录中，CLI 会报错。

## 输出格式

始终使用 `--json` 参数，以便解析结果。

## 常用流程

### 1. 检查服务器状态

```bash
comfyui-skill server status --json
```

### 2. 查看可用工作流

```bash
comfyui-skill list --json
```

### 3. 查看工作流参数

```bash
comfyui-skill info <skill_id> --json
```

skill_id 格式为 `server_id/workflow_id`，如 `local/txt2img`。

### 4. 文生图（txt2img）

```bash
comfyui-skill run local/txt2img --args '{"prompt": "a white cat on the beach", "seed": 42}' --json
```

输出文件会自动下载到配置的 output_dir，结果 JSON 中的 `outputs[].local_path` 是文件路径。

### 5. 图生图（img2img）

先上传输入图片，再运行工作流：

```bash
# 上传图片，记住返回的 name 字段
comfyui-skill upload ./input.png --json

# 用返回的 name 作为参数
comfyui-skill run local/img2img --args '{"image": "input.png", "prompt": "oil painting style"}' --json
```

### 6. 导入新工作流

```bash
# 从本地 JSON 文件导入
comfyui-skill workflow import ./my_workflow.json --check-deps --json

# 从 ComfyUI 服务器导入
comfyui-skill workflow import --from-server --json

# 安装缺少的依赖
comfyui-skill deps install local/my-workflow --all --json
```

### 7. 查看执行历史

```bash
comfyui-skill history list local/txt2img --limit 5 --json
```

## 服务器管理

```bash
# 添加远程服务器
comfyui-skill server add --id remote --url http://192.168.1.100:8188 --name "Remote GPU" --json

# 查看所有服务器
comfyui-skill server list --json
```

## 参数说明

工作流的参数通过 `--args` 以 JSON 格式传入。使用 `comfyui-skill info <skill_id> --json` 查看每个工作流支持的参数、类型和默认值。

常见参数：
- `prompt` (string) — 正向提示词
- `negative_prompt` (string) — 负向提示词
- `seed` (int) — 随机种子，-1 为随机
- `width` / `height` (int) — 图像尺寸
- `steps` (int) — 采样步数
- `cfg_scale` (float) — CFG 引导强度
- `image` (string) — 输入图片名（需先 upload）

## 注意事项

- 长时间运行的工作流可以用 `submit` 代替 `run`（非阻塞），然后用 `status` 轮询
- 使用 `--output-format stream-json` 可以获取实时进度事件
- 输出文件类型由工作流决定：image、audio 或 video
