---
title: PKM + Quartz 初步方案
tags:
  - plan
  - quartz
  - obsidian
---

# 個人任務與知識庫系統初步方案

日期：2026-05-02

## 1. 目標

建立一套以 Markdown 為中心的個人任務、收藏、知識沉澱與博客發佈系統，要求：

- 主庫可在 Obsidian 桌面與手機上長期使用
- 日常臨時任務、工作記錄、收藏內容都能進入同一體系
- 方便 AI 與人工搜尋、回顧、整理、再創作
- 可將整理後內容發佈為 Quartz 博客 / wiki / 圖譜
- 每項內容支援 1 個主標籤與多個副標籤
- 標籤由專門標籤文件集中定義

## 2. 路徑分工

### 2.1 主庫

`G:\google\obsifiles\26todamoon`

用途：

- 唯一真實來源
- Obsidian 桌面與手機同步使用
- 保存任務、日誌、收藏、知識、博客草稿

### 2.2 發佈庫

`F:\temp\lovetrueglory`

用途：

- Quartz 項目目錄
- 只負責發佈，不作為日常主編輯庫
- 從主庫選取可公開內容輸出到 Quartz `content/`

### 2.3 工具區

`D:\work\agents\dayplay`

用途：

- 採集、清洗、同步腳本
- 臨時導出文件
- 各平台收藏的整理工具
- 保存具體來源數據

建議它不要再承擔內容主庫角色，避免資料分叉。

### 2.4 來源數據區

`D:\work\agents\dayplay\source\`

用途：

- 保存各平台原始匯出與抓取結果
- 作為重資料存放區
- 供後續腳本標準化、去重、補全元數據

建議按來源分目錄，例如：

```text
D:\work\agents\dayplay\source\
├─ bookmarks\
├─ github\
├─ x\
├─ bilibili\
└─ youtube\
```

## 3. 核心流程

整體流程採用四層：

1. Ingest
   原始來源進庫，例如 X 收藏、GitHub stars、Chrome/Google 書籤、Bilibili 收藏、臨時任務、每日記錄。
2. Triage
   對新內容做判斷：補充信息、建立新條目、歸檔、忽略。
3. Library
   進入可長期維護的 Markdown 知識庫，形成 wiki 結構、關聯、標籤、總結。
4. Publish / Use
   將適合公開的內容輸出到 Quartz，作為博客、知識圖譜或主題頁。

## 4. 主庫目錄初稿

```text
G:\google\obsifiles\26todamoon\
├─ 00-inbox\
├─ 02-daily\
├─ 10-tasks\
├─ 20-collections\
│  ├─ bookmarks\
│  ├─ github\
│  ├─ x\
│  ├─ bilibili\
│  └─ youtube\
├─ 30-knowledge\
├─ 40-blog\
├─ 50-assets\
├─ 90-templates\
└─ 99-system\
   ├─ tags\
   ├─ indexes\
   └─ rules\
```

分工：

- `00-inbox`：還沒分類的新內容
- `02-daily`：每天的隨手任務、流水記錄
- `10-tasks`：正式任務與任務日誌
- `20-collections`：收藏內容的主題入口
- `30-knowledge`：沉澱後的知識條目
- `40-blog`：準備發佈的文章
- `50-assets`：圖片、附件、媒體
- `99-system`：標籤、索引、規範

## 5. 任務與日誌方案

### 5.1 每日流水

放在：

`G:\google\obsifiles\26todamoon\02-daily\YYYY-MM-DD.md`

用途：

- 臨時待辦
- 當天零碎工作記錄
- 尚未升級為正式任務的想法

### 5.2 正式任務

採用每周目錄 + 單文件任務：

`G:\google\obsifiles\26todamoon\10-tasks\2026-W18\0502-2215_install-node.md`

命名規則：

- `MMDD-HHMM_任務名.md`
- 時間在前，任務名在後

單文件內包含：

- Brief：任務大概
- Where：詳細信息去哪查
- Log：處理過程
- Summary：最終結果與可複用信息

此方案先以輕量為主，若之後某任務跨天、附件多、沉澱價值高，可升級為任務資料夾結構。

## 6. 收藏與知識方案

### 6.1 收藏來源

預計納入：

- X bookmarks / 高價值帖子
- GitHub stars / repo / issue / discussion
- 多個 Google 帳號的書籤
- Bilibili 收藏視頻與簡介
- YouTube、網頁收藏等

### 6.2 三層表示

每類來源分三層：

1. Raw
   原始匯出檔，例如 HTML、JSON、CSV、手動保存的 URL 清單，放在 `D:\work\agents\dayplay\source\`。
2. Normalized
   轉為統一結構的資料，例如 `jsonl`，仍放在外部 source 區或其子目錄。
3. Curated
   人工或 AI 整理後的 Markdown 索引卡與知識條目，供 Obsidian 與 Quartz 使用。

### 6.3 格式原則

- 面向人與發佈：`.md`
- 面向腳本與 AI：`.jsonl`
- 面向備份與再處理：原始匯出格式

不建議把海量收藏直接全部轉為單獨 Markdown，也不建議 Obsidian 只保存一條裸引用。推薦：

- 全量原始數據先進 `D:\work\agents\dayplay\source\`
- 高價值內容在主庫建立 Markdown 索引卡
- 精選後再提升為 `20-collections` 或 `30-knowledge` 的正式條目

### 6.4 Obsidian 索引卡原則

Obsidian 內對每個高價值收藏至少保留一個輕量索引卡，而不是只記外部路徑或網址。

索引卡應至少包含：

- 標題
- 來源平台
- 原始數據路徑
- 原網址
- 簡短摘要
- 為什麼要收藏
- 主標籤與副標籤

這樣可以同時滿足：

- Obsidian 內搜索
- 手機端閱讀
- AI 在 vault 內整理
- 後續升級成 wiki / blog

## 7. 標籤系統

### 7.1 標籤原則

每一項內容使用：

- `primary_tag`：唯一主標籤
- `secondary_tags`：多個副標籤

### 7.2 標籤定義文件

標籤集中定義於：

```text
G:\google\obsifiles\26todamoon\99-system\tags\
├─ primary-tags.md
├─ secondary-tags.md
└─ tag-aliases.md
```

用途：

- `primary-tags.md`：定義主分類，例如 tech / business / health / design / research
- `secondary-tags.md`：定義細分類，例如 javascript / obsidian / quartz / browser / ai-agent
- `tag-aliases.md`：統一同義詞或別名，避免重複標籤

### 7.3 條目 frontmatter 初稿

```yaml
---
title: install node
type: task
status: doing
primary_tag: tech
secondary_tags: [setup, nodejs, windows]
summary: 安裝 Node.js，處理 PATH 問題並驗證 npm 可用
refs:
  - https://nodejs.org/
publish: false
---
```

收藏索引卡可擴展為：

```yaml
---
title: example resource
type: resource
source: x
primary_tag: tech
secondary_tags: [ai, agent, workflow]
source_path: D:\work\agents\dayplay\source\x\2026-05\example.json
source_url: https://x.com/example/status/123
summary: 這條內容主要討論 AI 工作流
publish: false
---
```

## 8. 發佈策略

Quartz 發佈庫位於：

`F:\temp\lovetrueglory`

建議發佈內容：

- `30-knowledge` 的部分條目
- `40-blog` 的正式文章
- `99-system/indexes` 中適合公開的導航頁

建議不直接公開：

- `02-daily`
- 大部分 `10-tasks`
- `D:\work\agents\dayplay\source\` 下的原始數據
- 私人收藏原件與未整理內容

Quartz 站點角色：

- 博客
- wiki
- tag pages
- graph / knowledge map

## 9. 初步工作流

### 9.1 任務流

1. 在 `02-daily` 記下臨時事項
2. 值得追蹤的內容升級到 `10-tasks`
3. 在任務文件裡記錄處理過程與最終總結
4. 有沉澱價值時，提煉到 `30-knowledge`
5. 適合公開時，整理進 `40-blog` 並發佈到 Quartz

### 9.2 收藏流

1. 收藏或匯出內容先進 `D:\work\agents\dayplay\source\`
2. 腳本將其標準化為可檢索格式，例如 `jsonl`
3. 人工或 AI 做 triage
4. 高價值內容在主庫建立 Markdown 索引卡
5. 進一步整理為 `20-collections` 或 `30-knowledge`
6. 主題成熟後再轉為 `40-blog`

## 10. 初步結論

本方案採用：

- Obsidian 主庫作為唯一真實來源
- Quartz 作為獨立發佈層
- 採集與同步腳本獨立放在 `D:\work\agents\dayplay`
- 原始來源數據獨立放在 `D:\work\agents\dayplay\source\`
- 任務採用每周目錄 + 時間前綴單文件
- 收藏採用 raw / normalized / curated 三層
- Obsidian 主庫保留索引卡與知識條目，而不是只存裸引用
- 標籤採用主標籤 + 副標籤，並由專門標籤文件集中定義

這份文檔作為第一版方案，用於後續與其他結構方案對比，再決定最終落地形式。
