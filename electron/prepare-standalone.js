// After `next build`, the standalone server needs .next/static + public
// copied inside .next/standalone (Next.js documented layout).
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const from = (p) => path.join(root, p);

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`skip (missing): ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
  console.log(`copied: ${src} -> ${dest}`);
}

copyDir(from(".next/static"), from(".next/standalone/.next/static"));
copyDir(from("public"), from(".next/standalone/public"));
console.log("standalone ready");
