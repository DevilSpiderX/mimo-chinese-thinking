/**
 * 冒烟测试：验证打包产物 dist/chinese-thinking.min.js（插件形态）的行为。
 * 运行：npm test（先 esbuild 打包再执行本文件）
 */
import assert from "node:assert/strict"

const mod = await import("../dist/chinese-thinking.min.js")
const plugin = mod.default

// 1. 插件契约：default export { id, server }（本地路径插件必须有 id）
assert.equal(plugin.id, "mimo-chinese-thinking")
assert.equal(typeof plugin.server, "function")

// 2. server() 返回 Hooks，含系统提示词钩子
const hooks = await plugin.server({}, {})
const transform = hooks["experimental.chat.system.transform"]
assert.equal(typeof transform, "function")

// 3. 注入位置：插到 system 最前，保留已有段落
const output = { system: ["已有段落"] }
await transform({}, output)
assert.equal(output.system.length, 2)
assert.match(output.system[0], /must always be written in Simplified Chinese/)
assert.equal(output.system[1], "已有段落")

// 4. 幂等：同一 output.system 二次调用不重复注入
await transform({}, output)
assert.equal(output.system.length, 2)

// 5. 环境变量关闭：server() 每次调用读取环境变量，返回空 Hooks
process.env.MIMO_CHINESE_THINKING = "off"
assert.deepEqual(await plugin.server({}, {}), {})
delete process.env.MIMO_CHINESE_THINKING

console.log("smoke OK")
