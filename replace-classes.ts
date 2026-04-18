import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

const replacements = [
  { search: /bg-blue-600/g, replace: 'bg-primary' },
  { search: /text-blue-400/g, replace: 'text-accent' },
  { search: /bg-blue-700/g, replace: 'bg-primary/90' },
  { search: /bg-\[#0a0f1e\]/g, replace: 'bg-background' },
  { search: /bg-\[#111827\]/g, replace: 'bg-surface' },
  { search: /text-\[#3b82f6\]/g, replace: 'text-primary' },
  { search: /border-\[#0a0f1e\]/g, replace: 'border-background' },
  { search: /border-\[#111827\]/g, replace: 'border-surface' }
];

function processDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
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
