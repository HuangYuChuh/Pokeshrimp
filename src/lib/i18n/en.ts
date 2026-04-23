export const en = {
  // ── Common ──
  save: "Save",
  saving: "Saving...",
  saved: "Saved!",
  cancel: "Cancel",
  delete: "Delete",
  add: "Add",
  edit: "Edit",
  close: "Close",
  confirm: "Confirm",
  import: "Import",

  // ── Sidebar ──
  newTask: "New task",
  recents: "Recents",
  skills: "Skills",
  settings: "Settings",
  deleteSession: "Delete session",
  confirmDelete: "Click again to confirm",

  // ── Chat ──
  emptyTitle: "What would you like to create?",
  emptyDescription: "Describe what you want to create, and leave the rest to me",
  inputPlaceholder: "Describe what you want to create, type / for skills...",
  noSkillsMatch: "No skills match",
  reRun: "Re-run",
  editAndReRun: "Edit & Re-run",
  regenerate: "Regenerate",
  done: "Done",
  running: "Running",
  input: "Input",
  result: "Result",

  // ── Settings ──
  settingsTitle: "Settings",
  accounts: "Accounts",
  models: "Models",
  tools: "Tools",
  automation: "Automation",
  appearance: "Appearance",
  language: "Language",

  // ── Settings > Accounts ──
  accountsDescription: "API keys for connecting to LLM providers.",
  anthropicHint: "Required for Claude models",
  openaiHint: "Required for GPT models",
  getKey: "Get key",
  loginWithOpenAI: "Login with OpenAI",
  connecting: "Connecting...",
  oauthConnected: "Connected — token auto-refreshes",
  envKeyPriority: "Config key takes priority over env var",

  // ── Settings > Models ──
  modelsDescription: "Choose the default model for new conversations.",
  defaultModel: "Default Model",

  // ── Settings > Appearance ──
  appearanceDescription: "Customize the visual style of the application.",
  theme: "Theme",
  dark: "Dark",
  light: "Light",
  system: "System",
  languageLabel: "Language",
  chinese: "中文",
  english: "English",

  // ── Settings > Skills ──
  skillsDescription: "Installed .skill.md files that teach the agent CLI tools.",
  noSkills: "No skills installed",
  noSkillsHint: "Drag a .skill.md file onto the app or click Import.",

  // ── Settings > Tools ──
  toolsDescription: "CLI tools and MCP server connections.",
  cliTools: "CLI Tools",
  noTools: "No CLI tools required by installed skills.",
  available: "Available",
  notInstalled: "Not installed",

  // ── Settings > Automation ──
  automationDescription: "Hook scripts and command permission rules.",

  // ── Preview ──
  preview: "Preview",
  editor: "Editor",
  output: "Output",
  designfile: "Designfile",
  parameters: "Parameters",
  generatedContent: "Generated content will appear here",
  outputFiles: "Output files will appear here",

  // ── Misc ──
  configPath: "~/.visagent/config.json",
  dropSkill: "Drop .skill.md to install",
} as const;
