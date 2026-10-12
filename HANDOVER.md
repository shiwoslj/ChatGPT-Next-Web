# Next-Chat — Handover

这是 [`shiwoslj/ChatGPT-Next-Web`](https://github.com/shiwoslj/ChatGPT-Next-Web) 的交接文档,它是 `ChatGPTNextWeb/NextChat` 的一个私人 fork,部署在 Vercel 上自用。

本文件只保留当前仍然成立的内容。发布历史和决策原因在 [`docs/HANDOVER-LOG.md`](docs/HANDOVER-LOG.md),每项改动的完整理由在对应 PR 的正文里。维护规则见 [`CLAUDE.md`](CLAUDE.md)。

## 当前状态

fork 与上游持平(上游 `839a24d`,2026-10-08),在此之上做了 Claude 型号更新、供应商精简、安全加固和隐私清理。生产环境运行 `f8915ee`。

- **sha 约定**:上面的 sha 指最后一次**代码**发布,纯文档提交不更新它。
- **核对时间**:2026-10-11。`tsc --noEmit` 无报错,jest 40 个套件 204 项通过,Vercel 生产部署成功,GitHub 上 `Run Tests` 通过。

## 最近发布

| PR  | sha       | 内容                                                          |
| --- | --------- | ------------------------------------------------------------- |
| #14 | `da9a936` | 新增交接文档和项目级 `CLAUDE.md`(纯文档,代码不变)             |
| #13 | `f8915ee` | 去掉上游的 Google Analytics 默认 ID、付费版推广入口和点击统计 |
| #12 | `9a47644` | MCP 未启用时拒绝全部 MCP 服务端函数;发消息不再每次查询服务器  |
| #11 | `c93ed4f` | 关闭无鉴权的 `/api/proxy`,停用插件,不再请求 `ghp.ci`          |
| #10 | `9436f75` | 只保留 OpenAI / Anthropic / Google / DeepSeek 四家供应商      |
| #9  | `757f639` | Claude 5 拒答时由服务端自动换模型重答                         |
| #8  | `372458e` | 加入 Claude 5 系列,剔除已退役型号,适配请求参数                |
| #7  | `bb2c085` | 合并上游 52 个提交(merge commit)                              |

#1–#6 见日志。

## 下一步

### P0:需要仓库所有者本人处理

- **吊销旧的 OpenAI key**。#11 之前,任何人都可以绕过访问码使用 Vercel 里配置的 `OPENAI_API_KEY`。所有者说这个 key 已弃用;如果只是不再使用而没有在 OpenAI 后台吊销,需要吊销,并把该环境变量从 Vercel 删除。
- **在浏览器里看一遍 #11–#13 之后的界面**:登录页、设置页、侧边栏。这三个 PR 的界面改动只做过类型检查和构建,没有人在浏览器里确认过。
- **确认 #9 之后四个型号仍能回复**:`claude-opus-5-5`、`claude-fable-5-1`、`claude-opus-5`、`claude-sonnet-5-5` 各发一条消息。#9 给它们的请求加了 beta 参数,合并后没有收到报错,但也没有明确确认过。

### P1

- **`claude-sonnet-4-5` 将于 2026-11-30 退役**。届时从 `app/constant.ts` 的 `anthropicModels` 和 `KnowledgeCutOffDate` 里删掉它的两个 ID。同一页面上 `claude-haiku-4-5` 的最早退役日是 2026-10-15,`claude-opus-4-5` 是 2026-11-24,实际日期尚未公布,需要留意。依据是 <https://platform.claude.com/docs/en/about-claude/model-deprecations>。
- **"闲置一段时间后发消息就崩溃"没有定位**。#12 去掉了每条消息发送前的一次服务端查询,那次查询失败会中断发送,是嫌疑点,但问题从未被复现。再次出现时需要崩溃页上的报错文字或截图,以及浏览器类型。
- **OpenAI / Google / DeepSeek 的型号列表自 #1 起没有核对过**,其中有按命名规律推测的 ID,#1 的正文列出了哪些是推测的。

### P2

- GitHub 上还留着 8 个已合并的远程分支,删除前需要所有者同意。
- Claude 会话用当前型号生成标题和历史摘要,选 Fable 5.1 时偏贵。在设置里把"压缩模型"设为 `claude-haiku-5-5` 即可,不需要改代码。
- `next lint` 在未改动的上游代码上就会崩溃(`eslint-plugin-unused-imports`),没有修。
- #9 的"由某型号代答"提示只有单元测试覆盖,没有在真实拒答中出现过。

## Active footguns

只列现在仍可能踩到的。修掉的当天从这里删除,全文移到日志。

| 坑                                                                                                                                     | 怎么避免                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **本地仓库在 exFAT 外置盘上**。装不了依赖(没有软链接);macOS 还会生成 `._` 开头的文件,让 git 报 `non-monotonic index` 和 `badRefName`。 | 只读操作之外的事都在内置磁盘的克隆里做,从那里推送,最后回外置盘 `git pull`。外置盘上每次 git 写操作后清理 `._*` 文件。不要在那里用 `git add -A`。 |
| **`gh` 默认把上游当作目标仓库**。                                                                                                      | 每条 `gh pr ...` 都带 `--repo shiwoslj/ChatGPT-Next-Web`,否则 PR 会开到公开的上游项目里。                                                        |
| **同步上游用错合并方式**。squash 会丢掉上游的提交关系,GitHub 会继续显示落后,下次同步再冲突一遍。                                       | 同步 PR 必须用 "Create a merge commit"。不要点 GitHub 的 "Discard commits"。`Upstream Sync` 工作流保持停用。                                     |
| **同步上游会把已删除或已加固的东西带回来**。上游至今仍有这些问题。                                                                     | 合并后逐项检查下面"fork 与上游的差异"表。其中路由 `default` 分支返回 404 这一项**没有**单元测试兜底,要手动确认 `app/api/proxy.ts` 没有回来。     |
| **大改动放在同步之前**。上游会成批修改全部语言文件和 `.env.template`。                                                                 | 先同步,再做涉及多文件的改动。                                                                                                                    |
| **合并进 `main` 就是发布生产**,没有中间环节。                                                                                          | 合并前在 PR 的 Vercel 预览上确认。合并方式和时机由所有者决定。                                                                                   |
| **PR 不会自动跑测试**。`Run Tests` 只在推送 `main` 或请求评审时触发。                                                                  | 开 PR 前本地跑 `tsc`、jest 和构建。                                                                                                              |
| **这台机器上没有任何 API key**。                                                                                                       | 涉及真实接口的行为(新型号、新参数)只能由所有者在预览或生产上验证,PR 的 Test plan 里要写明哪些没验证。                                            |
| **`CLAUDE_FALLBACK_BETA` 是带日期的 beta 请求头**。Anthropic 停用后,四个启用 fallback 的型号会返回 400。                               | 报错提到 `fallbacks` 或 `anthropic-beta` 时,在 `app/utils/anthropic.ts` 更新或去掉它。                                                           |
| **不要在公网部署上设置 `ENABLE_MCP=true`**。MCP 服务端函数只检查这个开关,不检查访问码,其中包含启动本地进程。                           | 保持未设置。                                                                                                                                     |
| **`PLUGINS_ENABLED` 不能直接改回 `true`**。插件依赖的代理已删除。                                                                      | 重新启用前先实现带访问码校验的代理。                                                                                                             |
| **部署后旧标签页会失效**。                                                                                                             | 每次发布后提醒强制刷新。                                                                                                                         |

## 项目形状

### 仓库与部署

- **远程**:`origin` 是 fork(`shiwoslj/ChatGPT-Next-Web`),`upstream` 是 `ChatGPTNextWeb/NextChat`。
- **本地路径**:`/Volumes/KingSpe-1TB/00-Github/Next-Chat`(exFAT,见上表)。
- **部署**:Vercel 项目 `chat-gpt-next-web`(团队 `shiwosljs-projects`)。`main` 对应生产,其他分支各有预览。
- **已知的环境变量**(只记名称):`CODE` 已设置,访问码生效;`ANTHROPIC_API_KEY` 已设置;`OPENAI_API_KEY` 已弃用,待删除。其余变量的设置情况未知。
- **技术栈**:Next.js 14(app router)、React 18、TypeScript 5.2、zustand、jest 29,依赖以 `yarn.lock` 为准。

### fork 与上游的差异

| 领域               | 位置                                                                                                                             | 说明                                                                                               | 测试                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 启用的供应商       | `app/constant.ts`:`ENABLED_SERVICE_PROVIDERS`、`DISABLED_API_PATHS`                                                              | 其余 12 家只是隐藏并关闭接口,代码保留。恢复某一家要同时改这两处。                                  | `test/enabled-providers.test.ts`                                        |
| Claude 型号        | `app/constant.ts`:`anthropicModels`、`KnowledgeCutOffDate`                                                                       | 改之前先查官方退役页面。                                                                           | —                                                                       |
| Claude 请求规则    | `app/utils/anthropic.ts`                                                                                                         | 按型号版本决定采样参数、`max_tokens` 下限、是否启用 fallback。新主版本默认套用最新规则。           | `test/anthropic-model-traits.test.ts`、`test/anthropic-request.test.ts` |
| 已删型号不再复活   | `app/store/config.ts` 的 `merge()`                                                                                               | 内置型号列表始终取当前构建,不沿用浏览器缓存。                                                      | —                                                                       |
| 通用代理已关闭     | `app/api/[provider]/[...path]/route.ts` 的 `default` 分支;`app/api/proxy.ts` 已删除;`next.config.mjs` 去掉了 `/api/proxy/*` 重写 | 上游的代理不校验访问码,并会把 OpenAI key 附加到任何包含 `api.openai.com` 字样的地址。              | 无单元测试,见 #11 的实测表                                              |
| 插件已停用         | `app/constant.ts`:`PLUGINS_ENABLED`;`public/plugins.json` 为空                                                                   | 同时消除了对 `ghp.ci` 的请求。                                                                     | `test/plugins-disabled.test.ts`                                         |
| MCP 开关校验       | `app/mcp/actions.ts` 的 `assertMcpEnabled()`                                                                                     | 测试会对照模块的实际导出,新增函数不加校验会失败。                                                  | `test/mcp-actions-guard.test.ts`                                        |
| 统计与推广         | `app/config/server.ts` 的 `gaId`;登录页、设置页、20 个语言文件                                                                   | Google Analytics 只在自己设置 `GA_ID` 时加载。Vercel 自带的统计没有动,它的数据进所有者自己的账户。 | `test/no-upstream-telemetry.test.ts`                                    |
| 版本显示与更新检查 | `app/components/settings.tsx`、`app/constant.ts`:`FETCH_COMMIT_URL`                                                              | 设置页显示部署的 commit,更新检查对比本 fork。                                                      | —                                                                       |

### 关键命令

在内置磁盘的克隆里执行。本机只有 Node 26 和 npm,没有 yarn。

```bash
npx -y yarn@1.22.19 install --frozen-lockfile
node_modules/.bin/tsc --noEmit
node --no-warnings --experimental-vm-modules node_modules/jest/bin/jest.js --ci
npx -y tsx app/masks/build.ts && BUILD_MODE=standalone node_modules/.bin/next build
PORT=3111 HOSTNAME=127.0.0.1 node .next/standalone/server.js   # 本地起服务;不提供 public/ 下的文件
```

同步上游:

```bash
git fetch upstream main
git checkout -b chore/upstream-sync-<yyyy-mm> origin/main
git merge --no-ff upstream/main
```

之后按"fork 与上游的差异"表逐项检查,跑完测试和构建,再开 PR 并用 merge commit 合并。
