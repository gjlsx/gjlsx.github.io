# LoveTrueGlory

Quartz notes/blog for **https://wiki.lovemoney.live**  
（源码仓：`gjlsx/gjlsx.github.io`，Cloudflare Workers/Assets：`lovetrueglory`）

## 常用

```bash
# 本地预览
npx quartz build --serve

# 整站构建 → public/
npx quartz build

# 部署到 Cloudflare（需先 wrangler login）
npm run deploy
```

- 内容根：[`content/`](./content/)
- 构建输出：[`public/`](./public/)
- 工作文档：[`docs/`](./docs/)
- 旧站备份：[`quartz-backup/pre-quartz/`](./quartz-backup/pre-quartz/)

## 一键发单页 / 单目录 → 线上

脚本：[`tools/push-web.mjs`](./tools/push-web.mjs)  
别名：`npm run push-web -- <src> [dest]`

### 用法

```bash
# 单页 → 站点根 /xxx.html
node tools/push-web.mjs ./page.html
# 或
npm run push-web -- ./page.html

# 单页 → /abc/xxx.html
node tools/push-web.mjs ./page.html abc

# 目录内全部网页 → 站点根
node tools/push-web.mjs ./dirxx root

# 目录内全部网页 → /abc/
node tools/push-web.mjs ./dirav abc
```

| 参数 | 含义 |
|------|------|
| `src` | 本地 `.html` 文件，或包含网页资源的目录 |
| `dest` | 站点路径前缀；省略 / `root` → 根路径；`abc` → `/abc/` |

> **git-bash 注意**：裸参数 `/` 会被展开成 Git 安装目录。根路径请 **省略 dest** 或写 **`root`**。

### 默认流水线

1. 复制进 `content/<dest>/`（进内容树）
2. 更新 `content/index.md` 链接
3. `npx quartz build`
4. 再拷到 `public/`（保留真实 `.html` 扩展名）
5. `git add` / `commit` / `push`
6. `wrangler deploy`（需 `npx wrangler login` 或 `CLOUDFLARE_API_TOKEN`）

### 常用 flags

```bash
--dry-run      # 只打印计划
--no-build     # 跳过 quartz build
--no-deploy    # 跳过 wrangler
--no-push      # 跳过 git
--no-index     # 不改 content/index.md
-m "msg"       # commit message
-h, --help
```

### 首次部署 / 网络

```bash
npx wrangler login
npm run deploy
```

若 `wrangler deploy` 报 `fetch failed`，多半是本机代理/VPN 拦截 Cloudflare API；修好网络后再 `npm run deploy`。

### 已发布示例

- 本地页：桌面 `hermes-web-architectures.html`
- 入库路径：`content/hermes-web-architectures.html`、`public/hermes-web-architectures.html`
- 线上（deploy 成功后）：https://wiki.lovemoney.live/hermes-web-architectures.html
