/**
 * mimo-chinese-thinking —— MiMo Code 插件：强制模型思考（内部推理）使用中文。
 *
 * 本文件是 TypeScript 源码。构建：`npm run build` 打包压缩为
 * dist/chinese-thinking.min.js，把该 min.js 放进配置目录的 plugins/ 子目录即可自动加载——
 *   - 全局：~/.config/mimocode/plugins/
 *   - 项目：<project>/.mimocode/plugins/
 *
 * 插件形态（export default { id, server }）会注册进 MiMo Code 的插件系统，
 * 可在控制台的插件列表中查看是否已安装（id: mimo-chinese-thinking）。
 *
 * plugins/ 目录支持热重载：替换目录中的 min.js 即时生效，无需重启 MiMo Code。
 * 临时关闭：环境变量 MIMO_CHINESE_THINKING=off 后重启 MiMo Code。
 *
 * 机制：server() 返回 Hooks，其中注册 "experimental.chat.system.transform" 钩子，
 * 在 MiMo Code 每次组装系统提示词时把中文思考指令插入 output.system 最前面，
 * 对主会话与子代理统一生效。
 *
 * @mimo-ai/plugin 仅作类型导入，打包后无任何外部依赖。
 */

import type { Hooks, PluginModule } from "@mimo-ai/plugin"

const PLUGIN_ID = "mimo-chinese-thinking"

const DEFAULT_TEXT = `## Thinking Language (Mandatory Rule)

All of your internal thinking, reasoning, and chain of thought — including any hidden reasoning, planning, reflection, and self-questioning — **must always be written in Simplified Chinese**. There are no exceptions to this rule:

- No matter what language the user asks in, or what language the referenced documentation or code is in, the thinking process must always be in Chinese. The reasoning sentences around code, commands, and error messages must themselves be in Chinese; identifiers, code snippets, commands, file paths, API names, and proper nouns may stay in their original form.
- Do not form complete sentences in English (or any other language) while thinking, including the practice of "thinking in English first and translating later"; think in Chinese from the very beginning.
- This rule constrains only the language of **thinking**. Write the final answer in the language of the user's question (Chinese question → Chinese answer).
- Follow this rule in every session, in every gap between tool calls, and in every subagent task; if you catch yourself thinking in English, switch back to Chinese immediately and continue.`

// 幂等指纹：取指令文本首个非空行，防止同一 system 数组被多次改写时重复注入。
const fingerprint = DEFAULT_TEXT.split(/\r?\n/).find((line) => line.trim() !== "")?.trim() ?? DEFAULT_TEXT

const plugin: PluginModule = {
  id: PLUGIN_ID,

  server: async () => {
    const disabled = (process.env["MIMO_CHINESE_THINKING"] ?? "").trim().toLowerCase() === "off"
    if (disabled) return {}

    const hooks: Hooks = {
      "experimental.chat.system.transform": async (_input, output) => {
        if (output.system.some((segment) => segment.includes(fingerprint))) return
        output.system.unshift(DEFAULT_TEXT)
      },
    }

    return hooks
  },
}

export default plugin
