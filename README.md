# mimo-chinese-thinking

强制模型**思考（内部推理 / reasoning / 思维链）过程始终使用中文**的 MiMo Code 插件。
回答语言不受影响，仍跟随用户提问的语言。

这是 `dsh-chinese-thinking`（DSH Host 插件版）的 MiMo Code 移植版。
交付物是打包压缩后的单个 `min.js` 文件，放进 `plugins/` 目录即自动加载，
并出现在 MiMo Code 控制台的插件列表中，可查看/管理是否已安装。

## 安装

把构建产物 **`dist/chinese-thinking.min.js`** 拷进配置目录的 `plugins/` 子目录：

```
~/.config/mimocode/plugins/chinese-thinking.min.js        # 全局，对所有会话生效
<project>/.mimocode/plugins/chinese-thinking.min.js       # 仅本项目
```

无需其他配置，启动 `mimo` 即生效。插件会以 **`mimo-chinese-thinking`** 的 id
出现在控制台的插件列表中，可确认是否安装成功。文件名可自定（`.js` 均可）。

- **临时关闭**：环境变量 `MIMO_CHINESE_THINKING=off` 后重启 MiMo Code
- **卸载**：删除该文件
- `plugins/` 目录支持热重载：替换目录里的 `min.js` 即时生效，不用重启

## 原理

MiMo Code 会在 `<配置目录>/{plugin,plugins}/*.{js,ts}` 自动发现插件文件
（配置目录：全局 `~/.config/mimocode`、项目 `.mimocode`、`MIMOCODE_CONFIG_DIR`），
加载其默认导出的插件对象 `{ id, server }` 并注册进插件系统。

`server()` 返回 Hooks，其中注册 `experimental.chat.system.transform` 钩子
（`@mimo-ai/plugin` 的 `Hooks` 之一）：MiMo Code 每次组装系统提示词时，
把中文思考指令段落插入 `output.system` 最前面。
每次组装系统提示词都会触发该钩子，因此对主会话与子代理统一生效。

与 DSH 版的机制对应关系：

| | DSH 版 | MiMo 版 |
|---|---|---|
| 注入点 | `ctx.systemPrompt.section({ name, order, text })` | `"experimental.chat.system.transform"` → `output.system.unshift(text)` |
| 分发 | `cordis.patch.yml` 插入 profile 树 | 打包出 `min.js` 放进 `plugins/` 目录自动加载 |
| 可见性 | DSH 插件管理 | MiMo Code 控制台插件列表（id: `mimo-chinese-thinking`） |
| 语言 | JavaScript | TypeScript（源码）→ esbuild 打包压缩（交付） |

> **为什么不用「自定义工具」（`tools/`）？**
> 自定义工具只是 LLM 可调用的函数，无法注入系统提示词；
> 强制思考语言属于系统提示词约束，需要的是插件钩子。

## 文件

| 文件 | 职责 |
|---|---|
| `src/chinese-thinking.ts` | TypeScript 源码：`export default { id, server }` 插件（指令全文在此维护） |
| `dist/chinese-thinking.min.js` | **交付物**：esbuild 打包压缩产物（`npm run build` 生成） |
| `test/smoke.mjs` | 冒烟测试：插件契约、注入位置、幂等、环境变量开关 |
| `tsconfig.json` | 类型检查配置（`noEmit`，打包由 esbuild 负责） |
| `package.json` | scripts：`build` / `typecheck` / `test` |

## 构建与修改

```bash
npm install        # 开发依赖（esbuild / typescript / @types/node / @mimo-ai/plugin 类型）
npm run build      # 打包压缩：src/chinese-thinking.ts -> dist/chinese-thinking.min.js
npm run typecheck  # tsc --noEmit
npm test           # 重新打包后跑冒烟测试
```

修改指令文本：编辑 `src/chinese-thinking.ts` 里的 `DEFAULT_TEXT`
（保持反引号模板字符串完整），然后 `npm run build`，把新的 `min.js` 拷到
`plugins/` 目录替换旧文件（即时热重载）。`DEFAULT_TEXT` 首行同时是幂等指纹
（防止重复注入），改动后依然成立。

产物特性：esbuild `--bundle --minify` 输出 ESM 单文件（约 1.5 KB），
对 `@mimo-ai/plugin` 只有类型引用、打包后无任何外部依赖，拷贝单文件即可运行。

## 验证

使用者按「安装」一节拷贝 `min.js` 后启动 `mimo`，确认控制台插件列表中有
`mimo-chinese-thinking`，且模型内部推理全程使用简体中文（子代理任务同样遵守）。
仓库内自检：

```bash
npm test
```

## 与 DSH 版的差异

- `order: number`（段落排序）改为固定插入 `output.system` 最前（需要时可在源码里改 `push` 追加到末尾）
- `enabled` / `text` 配置项改为环境变量开关 + 改源码重新打包
- 无 `locale/`、`cordis.patch.yml`、插件清单（MiMo 无对应机制，也无需）
- 交付形态：源码 TypeScript，分发压缩后的 `min.js`
- 新增幂等保护：同一 `output.system` 被多次改写时不重复注入

## 已知风险

`experimental.chat.system.transform` 位于 experimental 命名空间，属实验性 API，
未来 MiMo Code 升级可能更名或变更签名。届时只需调整 `src/chinese-thinking.ts`
里的钩子注册处并重新打包；提示词内容不受影响。
