/*
 * 壬远 AI网关文档构建脚本：Markdown -> HTML 静态站点
 * 用法：node docs/scripts/build-manual.js
 */
const fs = require('fs');
const path = require('path');

const SITE_NAME = 'Rainway AI Gateway Web 文档';

const ROOT = path.join(__dirname, '..', 'zh-cn');
const SITE = path.join(ROOT, 'site');
const IMG_SRC = path.join(ROOT, 'images');
const IMG_DST = path.join(SITE, 'images');

const CHAPTERS = [
  '00-README.md',
  '01-login-and-user.md',
  '02-overview.md',
  '03-ai-gateway-pool.md',
  '04-model-provider.md',
  '05-ai-business-cluster.md',
  '06-model-prices.md',
  '07-entity-type.md',
  '08-entity.md',
  '09-api-key.md',
  '10-route.md',
  '11-certificates.md',
  '12-operation-logs.md',
  '13-scenarios.md',
  '14-appendix.md',
  'deploy.md',
  'develop.md',
];

// ---------- 极简 Markdown 解析 ----------
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function headingId(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function inline(s) {
  return s
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, href) => {
      const fixed = href.replace(/\.md(#.*)?$/, '.html$1');
      return '<a href="' + fixed + '">' + text + '</a>';
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function splitRow(line) {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((s) => s.trim().replace(/\\\|/g, '|'));
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  let para = [];
  const flushPara = () => {
    if (para.length) {
      out.push('<p>' + inline(escapeHtml(para.join(' '))) + '</p>');
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      flushPara();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push('<pre><code>' + escapeHtml(buf.join('\n')) + '</code></pre>');
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      const lv = h[1].length;
      const id = headingId(h[2]);
      out.push(
        '<h' +
          lv +
          ' id="' +
          id +
          '">' +
          inline(escapeHtml(h[2])) +
          '</h' +
          lv +
          '>',
      );
      i++;
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      flushPara();
      out.push('<hr/>');
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushPara();
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i++].replace(/^>\s?/, ''));
      }
      out.push('<blockquote>' + mdToHtml(buf.join('\n')) + '</blockquote>');
      continue;
    }

    if (
      /^\|.*\|/.test(line) &&
      i + 1 < lines.length &&
      /^\|[\s:|-]+\|?$/.test(lines[i + 1])
    ) {
      flushPara();
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|/.test(lines[i])) {
        rows.push(splitRow(lines[i++]));
      }
      let t =
        '<table><thead><tr>' +
        header.map((c) => '<th>' + inline(escapeHtml(c)) + '</th>').join('') +
        '</tr></thead><tbody>';
      t += rows
        .map(
          (r) =>
            '<tr>' +
            r.map((c) => '<td>' + inline(escapeHtml(c)) + '</td>').join('') +
            '</tr>',
        )
        .join('');
      t += '</tbody></table>';
      out.push(t);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushPara();
      const buf = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        buf.push(
          '<li>' +
            inline(escapeHtml(lines[i++].replace(/^[-*]\s+/, ''))) +
            '</li>',
        );
      }
      out.push('<ul>' + buf.join('') + '</ul>');
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushPara();
      const items = [];
      while (i < lines.length) {
        const m = /^\d+\.\s+(.*)$/.exec(lines[i]);
        if (m) {
          items.push({ text: m[1], sub: [] });
          i++;
          continue;
        }
        if (/^\s+\S/.test(lines[i]) && items.length) {
          items[items.length - 1].sub.push(lines[i].trim());
          i++;
          continue;
        }
        break;
      }
      const html = items
        .map((it) => {
          let inner = inline(escapeHtml(it.text));
          if (it.sub.length) {
            inner +=
              '<ul>' +
              it.sub
                .map(
                  (s) =>
                    '<li>' +
                    inline(escapeHtml(s.replace(/^[-*]\s+/, ''))) +
                    '</li>',
                )
                .join('') +
              '</ul>';
          }
          return '<li>' + inner + '</li>';
        })
        .join('');
      out.push('<ol>' + html + '</ol>');
      continue;
    }

    if (!line.trim()) {
      flushPara();
      i++;
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushPara();
  return out.join('\n');
}

function pageHtml(title, body, chapters, current) {
  const nav = chapters
    .map((c) => {
      const href = c.file.replace(/\.md$/, '.html');
      const active = c.file === current ? ' class="active"' : '';
      return (
        '<a' + active + ' href="' + href + '">' + escapeHtml(c.title) + '</a>'
      );
    })
    .join('');
  const docTitle =
    title === SITE_NAME ? SITE_NAME : escapeHtml(title) + ' - ' + SITE_NAME;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${docTitle}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; color: #1f2329; background: #f5f6f7; }
  .layout { display: flex; min-height: 100vh; }
  .sidebar { width: 260px; background: #1d2530; padding: 20px 0; position: fixed; top: 0; bottom: 0; overflow-y: auto; }
  .sidebar h1 { color: #fff; font-size: 16px; padding: 0 20px 12px; margin: 0; border-bottom: 1px solid #2c3646; }
  .sidebar a { display: block; color: #b8c2cc; text-decoration: none; padding: 10px 20px; font-size: 13px; }
  .sidebar a:hover { color: #fff; background: #2c3646; }
  .sidebar a.active { color: #fff; background: #2d6cf6; }
  .content { margin-left: 260px; flex: 1; padding: 32px 48px; max-width: 1080px; background: #fff; }
  h1 { font-size: 26px; } h2 { font-size: 20px; margin-top: 36px; border-bottom: 1px solid #e5e6eb; padding-bottom: 8px; } h3 { font-size: 16px; margin-top: 24px; }
  p { line-height: 1.8; }
  li { line-height: 1.8; margin: 4px 0; }
  code { background: #f2f3f5; border: 1px solid #e5e6eb; border-radius: 4px; padding: 1px 6px; font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 13px; }
  pre { background: #10141a; color: #d5dde5; border-radius: 8px; padding: 14px 16px; overflow-x: auto; }
  pre code { background: none; border: none; color: inherit; padding: 0; }
  table { border-collapse: collapse; margin: 12px 0; width: 100%; }
  th, td { border: 1px solid #dee0e3; padding: 8px 12px; font-size: 14px; text-align: left; }
  th { background: #f7f8fa; }
  blockquote { margin: 12px 0; padding: 10px 16px; background: #f7f8fa; border-left: 4px solid #2d6cf6; color: #4e5969; }
  blockquote p { margin: 4px 0; }
  img { max-width: 100%; border: 1px solid #e5e6eb; border-radius: 6px; margin: 8px 0; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
  a { color: #2d6cf6; }
</style>
</head>
<body>
<div class="layout">
  <nav class="sidebar">
    <h1>${SITE_NAME}</h1>
    ${nav}
  </nav>
  <main class="content">
${body}
  </main>
</div>
</body>
</html>`;
}

function main() {
  fs.mkdirSync(SITE, { recursive: true });
  fs.mkdirSync(IMG_DST, { recursive: true });

  if (fs.existsSync(IMG_SRC)) {
    for (const f of fs.readdirSync(IMG_SRC)) {
      if (/\.(png|jpg|jpeg|gif|svg)$/i.test(f)) {
        fs.copyFileSync(path.join(IMG_SRC, f), path.join(IMG_DST, f));
      }
    }
  }

  const chapters = [];
  const errors = [];

  for (const file of CHAPTERS) {
    const mdPath = path.join(ROOT, file);
    if (!fs.existsSync(mdPath)) {
      errors.push('缺少章节文件: ' + file);
      continue;
    }
    const md = fs.readFileSync(mdPath, 'utf-8');
    const titleMatch = /^#\s+(.*)$/m.exec(md);
    const title = titleMatch ? titleMatch[1] : file;
    chapters.push({ file, title });

    const imgRefs = [...md.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(
      (m) => m[1],
    );
    for (const ref of imgRefs) {
      if (ref.startsWith('images/')) {
        const imgFile = path.join(ROOT, ref);
        if (!fs.existsSync(imgFile)) {
          errors.push(file + ' 引用了不存在的图片: ' + ref);
        }
      }
    }
    const linkRefs = [...md.matchAll(/\[[^\]]*\]\(([^)]+\.md)(?:#[^)]*)?\)/g)]
      .map((m) => m[1])
      .filter((r) => !/^https?:\/\//i.test(r));
    for (const ref of linkRefs) {
      const norm = ref.replace(/^\.\//, '').split('#')[0];
      const linkPath = path.join(ROOT, norm);
      if (!fs.existsSync(linkPath)) {
        errors.push(file + ' 引用了不存在的文档: ' + ref);
      }
    }
  }

  for (const c of chapters) {
    const md = fs.readFileSync(path.join(ROOT, c.file), 'utf-8');
    const body = mdToHtml(md);
    const html = pageHtml(c.title, body, chapters, c.file);
    fs.writeFileSync(path.join(SITE, c.file.replace(/\.md$/, '.html')), html);
  }

  fs.writeFileSync(
    path.join(SITE, 'index.html'),
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=00-README.html"><title>' +
      SITE_NAME +
      '</title></head><body><a href="00-README.html">进入文档</a></body></html>',
  );

  if (errors.length) {
    console.log('构建完成，但存在以下问题:');
    for (const e of errors) console.log('  - ' + e);
    process.exit(1);
  }
  console.log('构建完成: ' + SITE);
  console.log('所有图片与链接校验通过');
}

main();
