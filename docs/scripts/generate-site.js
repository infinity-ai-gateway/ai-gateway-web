const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const SITE_NAME = 'Rainway AI Gateway Web 文档';

const docsDir = path.join(__dirname, '../zh-cn');
const siteDir = path.join(docsDir, 'site');
const imagesSourceDir = path.join(docsDir, 'images');
const imagesTargetDir = path.join(siteDir, 'images');

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Collect all markdown files in docs/zh-cn
// Manual chapters (00-11) come first alphabetically, followed by extras like deploy.md / develop.md
const mdFiles = fs
  .readdirSync(docsDir)
  .filter((f) => f.endsWith('.md'))
  .sort();

const pages = mdFiles.map((file) => {
  const filePath = path.join(docsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const baseName = path.basename(file, '.md');
  const htmlName = `${baseName}.html`;

  // Extract first h1 as page title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : baseName;

  // Replace internal .md links with .html links (keep external URLs unchanged)
  let htmlContent = md.render(content).replace(
    /href="([^"]+)\.md(#[^"]*)?"/g,
    (match, base, anchor) => {
      if (/^[a-z][a-z0-9+.-]*:\/\//i.test(base)) {
        return match; // external URL like https://.../deploy.md
      }
      return `href="${base}.html${anchor || ''}"`;
    }
  );

  return {
    file,
    baseName,
    htmlName,
    title,
    htmlContent,
  };
});

const navLinks = pages.map((page) => ({
  htmlName: page.htmlName,
  title: page.title,
}));

function buildPageHtml(page, navLinks) {
  const nav = navLinks
    .map((link) => {
      const activeClass = link.htmlName === page.htmlName ? ' class="active"' : '';
      return `<a${activeClass} href="${link.htmlName}">${link.title}</a>`;
    })
    .join('');

  const docTitle =
    page.title === SITE_NAME ? SITE_NAME : `${page.title} - ${SITE_NAME}`;

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
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .content { margin-left: 0; padding: 20px; }
  }
</style>
</head>
<body>
<div class="layout">
  <nav class="sidebar">
    <h1>${SITE_NAME}</h1>
    ${nav}
  </nav>
  <main class="content">
${page.htmlContent}
  </main>
</div>
</body>
</html>
`;
}

// Ensure site directory exists
if (!fs.existsSync(siteDir)) {
  fs.mkdirSync(siteDir, { recursive: true });
}

// Clean old HTML files in siteDir (keep images folder until copy)
const existingFiles = fs.readdirSync(siteDir);
existingFiles.forEach((file) => {
  if (file.endsWith('.html')) {
    fs.unlinkSync(path.join(siteDir, file));
  }
});

// Generate pages
pages.forEach((page) => {
  const html = buildPageHtml(page, navLinks);
  fs.writeFileSync(path.join(siteDir, page.htmlName), html, 'utf-8');
  console.log(`Generated: ${page.htmlName}`);
});

// Generate index.html redirect to README
const indexHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=00-README.html"><title>${SITE_NAME}</title></head><body><a href="00-README.html">进入文档</a></body></html>`;
fs.writeFileSync(path.join(siteDir, 'index.html'), indexHtml, 'utf-8');
console.log('Generated: index.html');

// Copy images
if (fs.existsSync(imagesSourceDir)) {
  if (!fs.existsSync(imagesTargetDir)) {
    fs.mkdirSync(imagesTargetDir, { recursive: true });
  }

  const images = fs.readdirSync(imagesSourceDir);
  images.forEach((image) => {
    const src = path.join(imagesSourceDir, image);
    const dest = path.join(imagesTargetDir, image);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
    }
  });
  console.log(`Copied ${images.length} images to ${imagesTargetDir}/`);
}

console.log(`\nSite generated in: ${siteDir}`);
