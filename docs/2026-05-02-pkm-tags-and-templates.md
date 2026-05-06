# 標籤與模板初稿

日期：2026-05-02

此文檔是 [個人任務與知識庫系統初步方案](/f:/temp/lovetrueglory/docs/2026-05-02-pkm-quartz-initial-plan.md) 的配套文件，目的是先定義：

- 標籤文件怎麼寫
- Obsidian 索引卡怎麼寫
- 任務文件怎麼寫
- 每日記錄怎麼寫

## 1. 標籤目錄

主庫中統一定義：

```text
G:\google\obsifiles\26todamoon\99-system\tags\
├─ primary-tags.md
├─ secondary-tags.md
└─ tag-aliases.md
```

原則：

- `primary_tag` 只能有 1 個
- `secondary_tags` 可以有多個
- 所有內容只能使用已定義標籤
- 新標籤先加到標籤文件，再在內容中使用

## 2. 主標籤文件格式

文件：

`G:\google\obsifiles\26todamoon\99-system\tags\primary-tags.md`

建議格式：

```md
# Primary Tags

## tech
- 說明：技術、工具、編程、系統配置
- 適用：程式、AI、軟件、效率工具

## business
- 說明：商業、產品、市場、盈利模式
- 適用：一人公司、增長、品牌、銷售

## research
- 說明：研究、資料收集、論點整理
- 適用：長文、資料庫、知識整理

## design
- 說明：設計、審美、UI、品牌視覺
- 適用：頁面、配色、排版、靈感

## media
- 說明：視頻、音頻、影視、內容收藏
- 適用：Bilibili、YouTube、播客、音樂

## life
- 說明：生活、健康、習慣、個人系統
- 適用：日常、運動、情緒、節奏
```

## 3. 副標籤文件格式

文件：

`G:\google\obsifiles\26todamoon\99-system\tags\secondary-tags.md`

建議格式：

```md
# Secondary Tags

## tech
- ai
- agent
- llm
- obsidian
- quartz
- javascript
- nodejs
- browser
- automation
- windows

## business
- solopreneur
- growth
- marketing
- pricing
- audience

## research
- source
- notes
- synthesis
- reading
- archive

## media
- bilibili
- youtube
- podcast
- movie
- music

## life
- routine
- fitness
- sleep
- reflection
```

這樣做的好處是：

- 主標籤和副標籤有層次
- 之後可以把 Quartz 的 tag page 做得更乾淨
- AI 比較容易判斷該落哪個主類

## 4. 標籤別名文件格式

文件：

`G:\google\obsifiles\26todamoon\99-system\tags\tag-aliases.md`

建議格式：

```md
# Tag Aliases

- js -> javascript
- node -> nodejs
- ai-agent -> agent
- obsidian-md -> obsidian
- pkm -> notes
- yt -> youtube
- bili -> bilibili
```

用途：

- 避免同義詞散掉
- 方便後續腳本做標籤規範化

## 5. 索引卡模板

適用於：

- X 收藏
- GitHub repo / issue / discussion
- Google 書籤
- Bilibili 視頻
- YouTube 視頻

建議放在：

`G:\google\obsifiles\26todamoon\90-templates\resource-card.md`

模板：

```md
---
title: 
type: resource
source: 
status: inbox
primary_tag: 
secondary_tags: []
summary: 
why_saved: 
source_url: 
source_path: 
created_at: 
captured_at: 
publish: false
---

# Brief

# Why Save

# Key Points
- 

# Source
- URL: 
- Raw File: 

# Links
- Related:
```

欄位說明：

- `source`：例如 `x`、`github`、`bookmark`、`bilibili`
- `status`：可用 `inbox`、`triaged`、`curated`、`archived`
- `summary`：一句話總結內容
- `why_saved`：你為什麼留它，這個非常重要
- `source_path`：指向 `D:\work\agents\dayplay\source\...`

## 6. 任務模板

建議放在：

`G:\google\obsifiles\26todamoon\90-templates\task.md`

命名規則：

`MMDD-HHMM_任務名.md`

例如：

`0502-2215_install-node.md`

模板：

```md
---
title: install node
type: task
status: doing
primary_tag: tech
secondary_tags: [setup, nodejs, windows]
summary: 安裝 Node.js 並解決 PATH 問題
refs: []
created_at: 2026-05-02 22:15
updated_at: 2026-05-02 22:15
publish: false
---

# Brief

# Where
- 官網：
- 相關文件：
- 相關 daily：

# Log
- 22:15 開始

# Summary

# Next
```

最小要求：

- `Brief` 寫任務大概
- `Where` 寫具體信息去哪查
- `Log` 記過程
- `Summary` 記最終結果

## 7. 每日記錄模板

建議放在：

`G:\google\obsifiles\26todamoon\90-templates\daily.md`

文件位置：

`G:\google\obsifiles\26todamoon\02-daily\YYYY-MM-DD.md`

模板：

```md
---
title: 2026-05-02
type: daily
primary_tag: life
secondary_tags: [routine]
publish: false
---

# Today
- 

# Temp Tasks
- [ ] 

# Notes
- 

# Promoted Tasks
- 
```

用途：

- 當天臨時待辦
- 零碎工作流水
- 晚上整理時把值得追蹤的項目升級成正式 task

## 8. 知識條目模板

建議放在：

`G:\google\obsifiles\26todamoon\90-templates\knowledge.md`

模板：

```md
---
title: 
type: knowledge
primary_tag: 
secondary_tags: []
summary: 
source_notes: []
publish: false
---

# Thesis

# Key Points
- 

# Evidence
- 

# Related
- 
```

用途：

- 從多條收藏或多個任務沉澱出一條可長期複用的知識
- 作為 blog 文章前一步

## 9. 推薦狀態值

任務：

- `todo`
- `doing`
- `blocked`
- `done`
- `archived`

收藏索引卡：

- `inbox`
- `triaged`
- `curated`
- `archived`

知識條目：

- `draft`
- `stable`
- `published`

## 10. 初步建議

先不要追求過多欄位，先固定住這三件事：

- 主標籤只能一個
- 每條高價值收藏都要有 `why_saved`
- 任務和知識都要有 `summary`

這樣做的好處是：

- 你自己搜索時更快
- AI 整理時更有上下文
- 之後輸出到 Quartz 時更容易做分類、tag page、wiki 導航
