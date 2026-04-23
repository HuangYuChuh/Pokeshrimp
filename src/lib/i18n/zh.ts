export const zh = {
  // ── Common ──
  save: "保存",
  saving: "保存中...",
  saved: "已保存！",
  cancel: "取消",
  delete: "删除",
  add: "添加",
  edit: "编辑",
  close: "关闭",
  confirm: "确认",
  import: "导入",

  // ── Sidebar ──
  newTask: "新任务",
  recents: "最近",
  skills: "技能",
  settings: "设置",
  deleteSession: "删除会话",
  confirmDelete: "再次点击确认删除",

  // ── Chat ──
  emptyTitle: "你想创作什么？",
  emptyDescription: "描述你想创作的内容，剩下的交给我",
  inputPlaceholder: "描述你想创作的内容，输入 / 调用技能...",
  noSkillsMatch: "没有匹配的技能",
  reRun: "重新运行",
  editAndReRun: "编辑后运行",
  regenerate: "重新生成",
  done: "完成",
  running: "运行中",
  input: "输入",
  result: "结果",

  // ── Settings ──
  settingsTitle: "设置",
  accounts: "账户",
  models: "模型",
  tools: "工具与集成",
  automation: "自动化",
  appearance: "外观",
  language: "语言",

  // ── Settings > Accounts ──
  accountsDescription: "连接 LLM 供应商的 API 密钥。",
  anthropicHint: "Claude 模型必需",
  openaiHint: "GPT 模型必需",
  getKey: "获取密钥",
  loginWithOpenAI: "使用 OpenAI 登录",
  connecting: "连接中...",
  oauthConnected: "已连接 — 令牌自动刷新",
  envKeyPriority: "配置密钥优先于环境变量",

  // ── Settings > Models ──
  modelsDescription: "选择新对话的默认模型。",
  defaultModel: "默认模型",

  // ── Settings > Appearance ──
  appearanceDescription: "自定义应用的视觉风格。",
  theme: "主题",
  dark: "深色",
  light: "浅色",
  system: "跟随系统",
  languageLabel: "语言",
  chinese: "中文",
  english: "English",

  // ── Settings > Skills ──
  skillsDescription: "已安装的 .skill.md 文件，教 Agent 使用 CLI 工具。",
  noSkills: "未安装技能",
  noSkillsHint: "拖拽 .skill.md 文件到应用中或点击导入。",

  // ── Settings > Tools ──
  toolsDescription: "CLI 工具和 MCP 服务器连接。",
  cliTools: "CLI 工具",
  noTools: "已安装的技能不需要 CLI 工具。",
  available: "可用",
  notInstalled: "未安装",

  // ── Settings > Automation ──
  automationDescription: "Hook 脚本和命令权限规则。",

  // ── Preview ──
  preview: "预览",
  editor: "编辑器",
  output: "输出",
  designfile: "设计文件",
  parameters: "参数",
  generatedContent: "生成的内容将在这里显示",
  outputFiles: "输出文件将在这里显示",

  // ── Misc ──
  configPath: "~/.visagent/config.json",
  dropSkill: "拖拽 .skill.md 文件安装",
} as const;
