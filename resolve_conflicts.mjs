import fs from 'fs';
import path from 'path';

function resolveFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('<<<<<<< HEAD')) return;

    const lines = content.split('\n');
    const newLines = [];
    let mode = 'normal'; // 'normal', 'skip', 'keep'

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('<<<<<<< HEAD')) {
            mode = 'skip';
        } else if (line.startsWith('=======')) {
            if (mode === 'skip') {
                mode = 'keep';
            } else {
                newLines.push(line);
            }
        } else if (line.startsWith('>>>>>>>')) {
            if (mode === 'keep') {
                mode = 'normal';
            } else {
                newLines.push(line);
            }
        } else {
            if (mode === 'normal' || mode === 'keep') {
                newLines.push(line);
            }
        }
    }

    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`Resolved: ${filePath}`);
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (!['node_modules', '.git', '.next'].includes(file)) {
                walkDir(fullPath);
            }
        } else {
            if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.json')) {
                resolveFile(fullPath);
            }
        }
    }
}

resolveFile('package.json');
walkDir('src');
console.log('Done resolving source conflicts.');
