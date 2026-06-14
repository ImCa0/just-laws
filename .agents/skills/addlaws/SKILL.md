---
name: addlaws
description: "已弃用的旧法律手工收录入口；默认改用 law-pipeline。"
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
license: MIT
source: https://github.com/justlaws/just-laws
---

# addlaws（已弃用）

本技能保留用于识别历史请求和排查旧格式，不再作为法律收录的默认流程。

新增、批量规范化或更新法律时，使用
[`../law-pipeline/SKILL.md`](../law-pipeline/SKILL.md) 及其
`scripts/normalize_law.py`。流水线会生成 A/B/C 类正文，并在
`--apply-site` 模式下同步 category、C 类 sidebar 和
`LAWS_PROGRESS.md`。

不要继续依赖旧流程中“AI 逐部手工格式化”“自动比较版本并备份”
“自动创建提交”等说明；当前流水线不提供后两项能力。遇到流水线 warning
时，只对相应附件、表格、图片、拆分或 slug 做定点人工复核。

仅当用户明确要求研究历史 `addlaws` 行为，或流水线存在尚未覆盖的格式且
需要诊断时，才查阅 Git 历史中的旧版说明。一般应修复流水线或映射后重新
运行，而不是恢复旧手工路径。
