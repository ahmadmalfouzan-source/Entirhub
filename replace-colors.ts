import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

const replacements = [
  { search: /#0a0f1e/gi, replace: 'var(--color-background)' },
  { search: /#111827/gi, replace: 'var(--color-surface)' },
  { search: /#3b82f6/gi, replace: 'var(--color-primary)' },
  { search: /#8b5cf6/gi, replace: 'var(--color-secondary)' },
];

const classesReplacements = [
  { search: /bg-\[#0a0f1e\]/g, replace: 'bg-[var(--color-background)]' },
  { search: /bg-\[#111827\]/g, replace: 'bg-[var(--color-surface)]' },
  { search: /text-\[#3b82f6\]/g, replace: 'text-[var(--color-primary)]' },
  { search: /border-\[#0a0f1e\]/g, replace: 'border-[var(--color-background)]' },
  // What about just replacing the hex codes? That will result in bg-[var(--color-background)] automatically since we do a global replace of the hex.
];

function processDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.html') || fullPath.endsWith('.svg')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let changed = false;
      for (const { search, replace } of replacements) {
        if (search.test(content)) {
          content = content.replace(search, replace);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(SRC_DIR);
