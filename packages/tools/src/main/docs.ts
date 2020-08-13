import path from 'path';
import { promises as fs } from 'fs';
import marked from 'marked';
import { PipeClass, ActionClass, Engine, ResolverService } from '@automationcloud/engine';

const targetDir = path.join(process.cwd(), '../../docs');

const files = ['index.md', 'Actions.md', 'Pipes.md'];

export async function buildDocs() {
    const engine = new Engine();
    const resolver = engine.get(ResolverService);
    await buildActionsDocs(resolver);
    await buildPipeDocs(resolver);
    for (const file of files) {
        const mdFile = path.join(targetDir, file);
        const htmlFile = mdFile.replace(/\.md$/i, '.html');
        const text = await fs.readFile(mdFile, 'utf-8');
        const html = htmlTemplate(marked(text));
        await fs.writeFile(htmlFile, html, 'utf-8');
    }
}

async function buildActionsDocs(resolver: ResolverService) {
    const file = path.join(targetDir, 'Actions.md');
    await buildDoc(file, '# Actions', resolver.getActionIndex());
}

async function buildPipeDocs(resolver: ResolverService) {
    const file = path.join(targetDir, 'Pipes.md');
    await buildDoc(file, '# Pipes', resolver.getPipeIndex());
}

async function buildDoc(file: string, preamble: string, map: Map<string, ActionClass | PipeClass>) {
    // Note: here's what shitty code looks like ;)
    // TODO rewrite it when you have 15 more minutes to spend on docs.
    const factories = [...map.values()].filter(f => !!f.$help.trim());
    const categories = [...new Set(factories.map(f => f.$metadata.ns))]
        .map(category => {
            return {
                category,
                factories: factories
                    .filter(f => f.$metadata.ns === category)
                    .sort((a, b) => (a.$type > b.$type ? 1 : -1)),
            };
        })
        .sort((a, b) => (a.category > b.category ? 1 : -1));
    const toc = categories
        .flatMap(cat => {
            const lines = [`- ${cat.category}`];
            for (const f of cat.factories) {
                lines.push(`  - [${f.$type}](#${f.$type})`);
            }
            return lines;
        })
        .join('\n');
    const docs = categories
        .flatMap(cat => {
            const lines = [`# ${cat.category}`];
            for (const f of cat.factories) {
                lines.push(`<h2 id="${f.$type}">${f.$type}</h2>`);
                lines.push(f.$help);
            }
            return lines;
        })
        .join('\n\n');
    const text = [preamble, toc, docs].join('\n\n');
    await fs.writeFile(file, text, 'utf-8');
}

function htmlTemplate(content: string) {
    return `
<!doctype html>
<html>
<head>
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Libre+Franklin:400,700&amp;display=swap"/>
    <link rel="stylesheet"
        href="./index.css"/>
    <link rel="shortcut icon"
        href="./favicon.ico"/>
    <title>Autopilot Documentation · ubio</title>
</head>
<body>
    <div class="container">
        <div class="header">
            <img class="logo" src="./logo.png"/>
            <a href="./Actions">Actions</a>
            <a href="./Pipes">Pipes</a>
        </div>
        <div class="body">
            ${content}
        </div>
    </div>
</body>
</html>
`;
}
