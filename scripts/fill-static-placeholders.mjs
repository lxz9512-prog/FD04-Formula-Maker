#!/usr/bin/env node
/**
 * 把平台构建（@lark-apaas/fullstack-vite-preset）留下的 mustache 占位符
 * 替换成静态站可用的值，并生成 404.html 供 GitHub Pages 的 SPA 回退使用。
 *
 * 用法：
 *   node scripts/fill-static-placeholders.mjs [构建输出目录] [站点子路径]
 *
 * 示例：
 *   node scripts/fill-static-placeholders.mjs dist-gh /FD04-Formula-Maker/
 *
 * 说明：
 * - 不传参时默认 `dist-gh` 与 `/FD04-Formula-Maker/`。
 * - 脚本是幂等的：重复执行只会报「剩余占位符: 无」。
 */
import fs from 'node:fs';
import path from 'node:path';

const outDir = process.argv[2] || 'dist-gh';
const basePath = process.argv[3] || '/FD04-Formula-Maker/';
const SITE_NAME = '智能调奶器交互演示';

const indexPath = path.join(outDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`[fill-placeholders] 找不到 ${indexPath}，请先执行 vite build`);
  process.exit(1);
}

// 子路径统一补首尾斜杠，避免拼出 // 或漏斜杠
const base = `/${basePath.replace(/^\/+|\/+$/g, '')}/`;
const siteUrl = `https://lxz9512-prog.github.io${base}`;

const replacements = [
  // 顺序重要：三花括号形式必须先替换，否则会残留一层花括号
  ['{{{appAvatar}}}', `${base}favicon.svg`],
  ['{{appAvatar}}', `${base}favicon.svg`],
  ['{{basename}}', '/'],
  ['{{csrfToken}}', ''],
  ['{{userId}}', ''],
  ['{{tenantId}}', ''],
  ['{{appId}}', ''],
  ['{{environment}}', 'production'],
  ['{{appName}}', SITE_NAME],
  ['{{appDescription}}', SITE_NAME],
  ['{{currentUrl}}', siteUrl],
];

let html = fs.readFileSync(indexPath, 'utf8');
for (const [token, value] of replacements) {
  html = html.split(token).join(value);
}
fs.writeFileSync(indexPath, html);

// GitHub Pages 自定义 404 需返回完整应用，HashRouter 下即可直接接管深链接
fs.copyFileSync(indexPath, path.join(outDir, '404.html'));

const left = html.match(/{{[^}]*}}/g);
console.log(
  '[fill-placeholders] 剩余占位符:',
  left ? [...new Set(left)].join(', ') : '无',
);
console.log(
  '[fill-placeholders] title:',
  (html.match(/<title>[^<]*<\/title>/) || ['(无)'])[0],
);
console.log('[fill-placeholders] 已同步生成 404.html');
