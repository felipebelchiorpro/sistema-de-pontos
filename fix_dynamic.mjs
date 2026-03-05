import fs from 'fs';
import path from 'path';

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (file === 'page.tsx') {
            const content = fs.readFileSync(p, 'utf8');
            if (!content.includes('force-dynamic')) {
                fs.writeFileSync(p, "export const dynamic = 'force-dynamic';\n" + content, 'utf8');
                console.log('Updated ' + p);
            }
        }
    }
}

walk('src/app');
