import marked from 'marked';
import sanitizeHtml from 'sanitize-html';

import { Controller } from '../controller';
import { App } from '../app';

export class HelpController implements Controller {
    constructor(public app: App) {}

    async init() {}

    getActionHelp(type: string): string {
        const ActionClass = this.app.resolver.getActionClass(type);
        const text = ActionClass.$help.trim();
        return text ? sanitize(marked(text)) : '';
    }

    getPipeHelp(type: string): string {
        const PipeClass = this.app.resolver.getPipeClass(type);
        const text = PipeClass.$help.trim();
        return text ? sanitize(marked(text)) : '';
    }
}

export interface HelpObject {
    type: string;
    text: string;
    html: string;
}

function sanitize(html: string) {
    return sanitizeHtml(html, {
        allowedTags: ['b', 'i', 'em', 'strong', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'hr', 'code', 'pre'],
    });
}
