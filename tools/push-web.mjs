#!/usr/bin/env node
/**
 * One-shot publish: single HTML page or a directory of pages → LoveTrueGlory web.
 *
 * Usage:
 *   node tools/push-web.mjs <src> [dest]
 *
 *   src   local .html file, or a directory of web files
 *   dest  site path prefix (default "/"):
 *           /          → /file.html
 *           abc        → /abc/file.html
 *           /abc/      → /abc/file.html
 *
 * Examples:
 *   node tools/push-web.mjs ./page.html
 *   node tools/push-web.mjs ./page.html abc
 *   node tools/push-web.mjs ./dirxx /
 *   node tools/push-web.mjs ./dirav /abc
 *
 * Pipeline (default):
 *   1) copy into content/<dest>/  (content tree)
 *   2) update content/index.md links
 *   3) quartz build
 *   4) re-copy assets into public/ with real .html extensions
 *   5) git add / commit / push
 *   6) wrangler deploy  (needs `wrangler login` or CLOUDFLARE_API_TOKEN)
 *
 * Flags:
 *   --no-build    skip quartz build
 *   --no-deploy   skip wrangler deploy
 *   --no-push     skip git commit/push
 *   --no-index    do not edit content/index.md
 *   --dry-run     print actions only
 *   -m, --message <msg>  commit message
 *   -h, --help
 */

import fs from "node:fs/promises"
import fsSync from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..")
const CONTENT = path.join(ROOT, "content")
const PUBLIC = path.join(ROOT, "public")
const INDEX_MD = path.join(CONTENT, "index.md")
const SITE = "https://wiki.lovemoney.live"

const WEB_EXTS = new Set([
  ".html",
  ".htm",
  ".css",
  ".js",
  ".mjs",
  ".cjs",
  ".map",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".txt",
  ".pdf",
  ".mp4",
  ".webm",
  ".xml",
])

function die(msg, code = 1) {
  console.error(`error: ${msg}`)
  process.exit(code)
}

function log(msg) {
  console.log(msg)
}

function isMsysRootPath(dest) {
  // git-bash converts a bare "/" argument into the MSYS install root
  // e.g. "C:/Program Files/Git" or "/c/Program Files/Git"
  const n = String(dest).replace(/\\/g, "/").replace(/\/+$/, "")
  if (/^[A-Za-z]:\/Program Files\/Git$/i.test(n)) return true
  if (/^\/[A-Za-z]\/Program Files\/Git$/i.test(n)) return true
  if (process.env.EXEPATH) {
    const exe = process.env.EXEPATH.replace(/\\/g, "/").replace(/\/+$/, "")
    if (exe && n.toLowerCase() === exe.toLowerCase()) return true
  }
  return false
}

function normalizeDest(dest) {
  if (
    !dest ||
    dest === "/" ||
    dest === "." ||
    dest === "./" ||
    dest === "\\" ||
    dest === "root" ||
    isMsysRootPath(dest)
  ) {
    return ""
  }
  // Prefer relative site paths: "abc" or "/abc" → "abc"
  // Absolute Windows paths outside the repo are treated as shell expansion mistakes.
  const asPosix = dest.replace(/\\/g, "/")
  if (path.win32.isAbsolute(dest) || path.posix.isAbsolute(asPosix)) {
    const rootPosix = ROOT.replace(/\\/g, "/").toLowerCase()
    if (!asPosix.toLowerCase().startsWith(rootPosix)) {
      // "/abc" from bash is absolute-posix; strip leading slash and keep as site path
      if (asPosix.startsWith("/") && !/^[A-Za-z]:\//.test(asPosix) && !/^\/[A-Za-z]\//.test(asPosix)) {
        return asPosix.replace(/^\/+/, "").replace(/\/+$/, "")
      }
      console.warn(`warn: unusual dest "${dest}" — treating as site root`)
      return ""
    }
  }
  return asPosix.replace(/^\/+/, "").replace(/\/+$/, "")
}

function parseArgs(argv) {
  const flags = {
    build: true,
    deploy: true,
    push: true,
    index: true,
    dryRun: false,
    message: "",
    help: false,
  }
  const pos = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "-h" || a === "--help") flags.help = true
    else if (a === "--no-build") flags.build = false
    else if (a === "--no-deploy") flags.deploy = false
    else if (a === "--no-push") flags.push = false
    else if (a === "--no-index") flags.index = false
    else if (a === "--dry-run") flags.dryRun = true
    else if (a === "-m" || a === "--message") {
      flags.message = argv[++i] || ""
    } else if (a.startsWith("-")) die(`unknown flag: ${a}`)
    else pos.push(a)
  }
  return { flags, pos }
}

function usage() {
  return `push-web — publish a single page or directory to LoveTrueGlory

Usage:
  node tools/push-web.mjs <src> [dest] [flags]

Arguments:
  src    local HTML file, or directory of web files
  dest   site path prefix (default: site root)
           omitted / root  → /file.html
           abc             → /abc/file.html
           /abc            → /abc/file.html
         Note: bare "/" may be expanded by git-bash; prefer omit or "root".

Flags:
  --no-build     skip quartz build
  --no-deploy    skip wrangler deploy
  --no-push      skip git commit/push
  --no-index     do not update content/index.md
  --dry-run      show plan only
  -m, --message  git commit message
  -h, --help

Examples:
  node tools/push-web.mjs ./hermes-web-architectures.html
  node tools/push-web.mjs ./dirxx root
  node tools/push-web.mjs ./dirav abc
  node tools/push-web.mjs ./page.html plans -m "add page"
`
}

async function pathExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function ensureDir(p, dryRun) {
  if (dryRun) {
    log(`  [dry-run] mkdir -p ${p}`)
    return
  }
  await fs.mkdir(p, { recursive: true })
}

async function copyFile(src, dest, dryRun) {
  if (dryRun) {
    log(`  [dry-run] copy ${src} → ${dest}`)
    return
  }
  await ensureDir(path.dirname(dest), false)
  await fs.copyFile(src, dest)
}

async function walkFiles(dir) {
  const out = []
  async function walk(cur, rel = "") {
    const entries = await fs.readdir(cur, { withFileTypes: true })
    for (const ent of entries) {
      if (ent.name === "." || ent.name === ".." || ent.name.startsWith(".")) continue
      const abs = path.join(cur, ent.name)
      const r = rel ? `${rel}/${ent.name}` : ent.name
      if (ent.isDirectory()) await walk(abs, r)
      else out.push({ abs, rel: r.replace(/\\/g, "/") })
    }
  }
  await walk(dir)
  return out
}

function isWebFile(relOrAbs) {
  const ext = path.extname(relOrAbs).toLowerCase()
  return WEB_EXTS.has(ext)
}

function isHtml(relOrAbs) {
  const ext = path.extname(relOrAbs).toLowerCase()
  return ext === ".html" || ext === ".htm"
}

async function collectSources(srcPath) {
  const st = await fs.stat(srcPath)
  if (st.isFile()) {
    if (!isWebFile(srcPath)) die(`not a publishable web file: ${srcPath}`)
    return [{ abs: srcPath, rel: path.basename(srcPath) }]
  }
  if (!st.isDirectory()) die(`src is neither file nor directory: ${srcPath}`)
  const all = await walkFiles(srcPath)
  const files = all.filter((f) => isWebFile(f.rel))
  if (!files.length) die(`no publishable web files under: ${srcPath}`)
  return files
}

function titleFromHtmlName(name) {
  return name
    .replace(/\.(html?|htm)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

async function updateIndexMd(htmlEntries, dryRun) {
  // htmlEntries: [{ title, urlPath }] urlPath like /abc/foo.html
  if (!(await pathExists(INDEX_MD))) {
    log("  warn: content/index.md missing, skip index update")
    return
  }
  let text = await fs.readFile(INDEX_MD, "utf8")
  const sectionHeader = "## 一键发布页面"
  let changed = false
  const linesToAdd = []
  for (const e of htmlEntries) {
    const linkLine = `- [${e.title}](${e.urlPath})`
    if (text.includes(e.urlPath) || text.includes(`](${e.urlPath})`)) continue
    // also skip if bare filename already linked
    linesToAdd.push(linkLine)
  }
  if (!linesToAdd.length) {
    log("  index.md already lists these pages")
    return
  }

  if (text.includes(sectionHeader)) {
    // append under section
    const parts = text.split(sectionHeader)
    const before = parts[0] + sectionHeader
    let after = parts.slice(1).join(sectionHeader)
    // insert after header line
    after = "\n\n" + linesToAdd.join("\n") + "\n" + after.replace(/^\n*/, "")
    text = before + after
    changed = true
  } else {
    // insert before "## 說明" if present, else append
    const block = `\n${sectionHeader}\n\n${linesToAdd.join("\n")}\n`
    if (text.includes("## 說明")) {
      text = text.replace("## 說明", `${block}\n## 說明`)
    } else {
      text = text.trimEnd() + "\n" + block
    }
    changed = true
  }

  if (!changed) return
  if (dryRun) {
    log(`  [dry-run] update content/index.md (+${linesToAdd.length} links)`)
    for (const l of linesToAdd) log(`    ${l}`)
    return
  }
  await fs.writeFile(INDEX_MD, text, "utf8")
  log(`  updated content/index.md (+${linesToAdd.length} links)`)
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    log(`  $ ${cmd} ${args.join(" ")}`)
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
      ...opts,
    })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited ${code}`))
    })
  })
}

async function git(args, dryRun) {
  if (dryRun) {
    log(`  [dry-run] git ${args.join(" ")}`)
    return
  }
  await run("git", args)
}

async function main() {
  const { flags, pos } = parseArgs(process.argv.slice(2))
  if (flags.help || pos.length === 0) {
    console.log(usage())
    process.exit(flags.help ? 0 : 1)
  }

  const srcArg = pos[0]
  const destArg = pos[1] || "/"
  const srcPath = path.resolve(process.cwd(), srcArg)
  const dest = normalizeDest(destArg)

  if (!(await pathExists(srcPath))) die(`src not found: ${srcPath}`)

  const sources = await collectSources(srcPath)
  const staged = [] // { absSrc, contentDest, publicDest, rel, isHtml }

  for (const f of sources) {
    const rel = f.rel.replace(/\\/g, "/")
    const contentDest = path.join(CONTENT, dest, rel)
    const publicDest = path.join(PUBLIC, dest, rel)
    staged.push({
      absSrc: f.abs,
      contentDest,
      publicDest,
      rel: dest ? `${dest}/${rel}` : rel,
      isHtml: isHtml(rel),
    })
  }

  log("push-web plan")
  log(`  root:   ${ROOT}`)
  log(`  src:    ${srcPath}`)
  log(`  dest:   /${dest}${dest ? "/" : ""}`)
  log(`  files:  ${staged.length}`)
  for (const s of staged) {
    log(`    → content/${s.rel}`)
    log(`      public/${s.rel}`)
  }
  log(
    `  steps:  stage${flags.index ? "+index" : ""}` +
      `${flags.build ? "+build" : ""}` +
      `${flags.deploy ? "+deploy" : ""}` +
      `${flags.push ? "+git-push" : ""}` +
      `${flags.dryRun ? " (dry-run)" : ""}`,
  )

  // 1) stage into content/
  log("\n[1/5] stage into content/")
  for (const s of staged) {
    await copyFile(s.absSrc, s.contentDest, flags.dryRun)
  }

  // 2) index.md
  if (flags.index) {
    log("\n[2/5] update content tree (index.md)")
    const htmlEntries = staged
      .filter((s) => s.isHtml)
      .map((s) => ({
        title: titleFromHtmlName(path.basename(s.rel)),
        urlPath: "/" + s.rel.replace(/\\/g, "/"),
      }))
    await updateIndexMd(htmlEntries, flags.dryRun)
  } else {
    log("\n[2/5] skip index.md")
  }

  // 3) quartz build
  if (flags.build) {
    log("\n[3/5] quartz build")
    if (flags.dryRun) log("  [dry-run] npx quartz build")
    else await run("npx", ["quartz", "build"])
  } else {
    log("\n[3/5] skip build")
  }

  // 4) re-copy with real extensions into public/
  //    Quartz Assets strips .html → extensionless files; we keep real names.
  log("\n[4/5] copy web assets into public/ (preserve extensions)")
  for (const s of staged) {
    await copyFile(s.absSrc, s.publicDest, flags.dryRun)
  }

  // 5) git commit + push (before deploy so local work is never lost on CF auth fail)
  if (flags.push) {
    log("\n[5/6] git commit & push")
    const msg =
      flags.message ||
      `publish web: ${
        staged
          .filter((s) => s.isHtml)
          .map((s) => s.rel)
          .slice(0, 5)
          .join(", ") ||
        dest ||
        "assets"
      }`
    // include CLI when present in tools/
    for (const p of ["content", "public", "tools/push-web.mjs"]) {
      await git(["add", "-A", "--", p], flags.dryRun)
    }
    if (flags.dryRun) {
      log(`  [dry-run] git commit -m ${JSON.stringify(msg)}`)
      log("  [dry-run] git push")
    } else {
      const status = await new Promise((resolve, reject) => {
        const child = spawn("git", ["status", "--porcelain"], {
          cwd: ROOT,
          shell: process.platform === "win32",
        })
        let out = ""
        child.stdout.on("data", (d) => (out += d))
        child.stderr.on("data", (d) => (out += d))
        child.on("error", reject)
        child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(out))))
      })
      if (!status.trim()) {
        log("  nothing to commit")
      } else {
        await git(["commit", "-m", msg], false)
        await git(["push"], false)
      }
    }
  } else {
    log("\n[5/6] skip commit/push")
  }

  // 6) deploy
  if (flags.deploy) {
    log("\n[6/6] wrangler deploy")
    if (flags.dryRun) log("  [dry-run] npm run deploy")
    else {
      try {
        await run("npm", ["run", "deploy"])
      } catch (err) {
        log("\n✗ deploy failed (git already done if enabled)")
        log("  fix: run `npx wrangler login` once, or set CLOUDFLARE_API_TOKEN")
        log("  then: npm run deploy")
        throw err
      }
    }
  } else {
    log("\n[6/6] skip deploy")
  }

  log("\n✓ done")
  const urls = staged
    .filter((s) => s.isHtml)
    .map((s) => `${SITE}/${s.rel.replace(/\\/g, "/")}`)
  if (urls.length) {
    log("live URLs (after successful deploy):")
    for (const u of urls) log(`  ${u}`)
  }
}

main().catch((err) => {
  console.error(err?.stack || err)
  process.exit(1)
})
