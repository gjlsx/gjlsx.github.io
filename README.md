# LoveTrueGlory

Quartz notes/blog for **https://wiki.lovemoney.live**  
源码仓：`gjlsx/gjlsx.github.io` · Cloudflare Worker：`lovetrueglory`（读仓库 **`public/`**）

## 发布模型（正式）

**本地保证 `public/` 正确 → `git push` → Worker 自动拉最新。**  
**不需要本机 `wrangler login` / 本机 `npm run deploy`。**

| 环节 | 说明 |
|------|------|
| 内容 | `content/`（Markdown + 可进树的资源） |
| 站点静态根 | **`public/`**（构建产物；Worker 读这个目录） |
| 上线 | **`git push` 到 `main`** |
| 自定义域名 | `wiki.lovemoney.live` |

```bash
# 本地预览
npx quartz build --serve

# 整站构建 → public/
npx quartz build

# 提交 public/（及 content/）后推送即可上线
git add content public
git commit -m "update site"
git push
```

本机 `npm run deploy`（wrangler）仅作**可选旁路/救急**，不是正式路径；且易打到错误 Cloudflare 账号。

## 一键发单页 / 单目录

脚本：[`tools/push-web.mjs`](./tools/push-web.mjs)   .
别名：`npm run push-web -- <src> [dest]`

### 用法

```bash
# 单页 → 站点根 /xxx.html
node tools/push-web.mjs ./page.html
# 或
npm run push-web -- ./page.html

# 单页 → /abc/xxx.html
node tools/push-web.mjs ./page.html abc

# 目录 → 站点根
node tools/push-web.mjs ./dirxx root

# 目录 → /abc/
node tools/push-web.mjs ./dirav abc
```

| 参数 | 含义 |
|------|------|
| `src` | 本地 `.html`，或网页资源目录 |
| `dest` | 路径前缀；省略 / `root` → 根；`abc` → `/abc/` |

> **git-bash**：裸 `/` 会被展开成 Git 安装目录。根路径请 **省略 dest** 或写 **`root`**。

### 默认流水线

1. 复制进 `content/<dest>/`（内容树）
2. 更新 `content/index.md` 链接
3. `npx quartz build` → `public/`
4. 再拷源文件到 `public/`（保留真实 `.html` 扩展名）
5. **`git add` / `commit` / `push`** → Worker 自动更新

### Flags

```bash
--dry-run       # 只打印计划
--no-build      # 跳过 quartz build
--no-push       # 跳过 git
--no-index      # 不改 content/index.md
--deploy        # 可选：本机 wrangler deploy（非正式路径）
-m "msg"        # commit message
-h, --help
```

### 示例页

- 源：桌面 `hermes-web-architectures.html`
- 入库：`content/` + `public/hermes-web-architectures.html`
- 线上：https://wiki.lovemoney.live/hermes-web-architectures.html  
  （`git push` 后等 Worker 拉最新；以线上 HEAD 为准）

## 目录

- [`content/`](./content/) — 内容
- [`public/`](./public/) — 构建输出 = **Worker 发布根**
- [`docs/`](./docs/) — 工作文档
- [`tools/push-web.mjs`](./tools/push-web.mjs) — 一键入库+构建+git push
