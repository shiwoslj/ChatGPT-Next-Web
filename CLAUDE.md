# Next-Chat — 项目规则

开始工作前先读 [`HANDOVER.md`](HANDOVER.md)。它列出当前状态、下一步和仍然有效的坑。

## Git 工作流

规范全文在 handover skill 的 "Git Delivery Discipline" 一节,这里是摘要,两者冲突时以 skill 为准。

- **非 trivial 改动一律走分支 + PR**,不直推 `main`。分支前缀:`feat/`、`fix/`、`docs/`、`chore/`、`refactor/`。
- **可以直推的只有四种**,而且每次都要先问所有者:改错别字或单行格式;回滚自己刚推的内容;所有者口头同意的紧急修复;合并后只更新索引的提交。
- **一个 PR 只做一件事**。Summary 超过三条,或改动跨了不相关的模块,就拆开。
- **PR 正文四段**:Summary(为什么)、Changes(改了哪里)、Test plan(验证了什么、没验证什么)、Handover updates(`HANDOVER.md` 要增改哪些行)。
- **引用改动用真实的 `#N`**。还没有 PR 的工作用描述性的名字,不要自编 "PR2" 这类序号。
- **每条 `gh` 命令都带 `--repo shiwoslj/ChatGPT-Next-Web`**。这是 fork,`gh` 默认指向上游。
- **合并由所有者决定**。合并进 `main` 会立即发布生产。同步上游的 PR 用 merge commit,其余用 squash。

## 交接文档

- **文件**:`HANDOVER.md`(当前状态,300 行以内)和 `docs/HANDOVER-LOG.md`(只追加)。没有跨项目 wiki 层。
- **持久内容随代码走**:新增或消除的坑、决策原因、状态事实,写进改动所在的同一个 PR。
- **索引内容合并后补**:发布表的一行、当前状态的 sha,在合并后用一次提交补上,补之前先问所有者。
- **sha 约定**:`HANDOVER.md` 里的"当前状态"指最后一次代码发布,纯文档提交不更新它。
- **只从一手来源更新**:git 历史、当前代码、GitHub 和 Vercel 的实际状态。不要把旧的交接内容当作事实来源;动到某一行之前先对照代码重新核实。
- **不得写入**:任何 API key、访问码、token,以及环境变量的值。环境变量只记名称。
