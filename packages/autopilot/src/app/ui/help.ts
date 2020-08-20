import marked from 'marked';
import sanitizeHtml from 'sanitize-html';

import { Controller } from '../controller';
import { App } from '../app';

export class HelpController implements Controller {
    helpItem: HelpItem | null = null;

    constructor(public app: App) {}

    async init() {}

    getActionHelp(type: string): string {
        const { help } = this.getActionHelpItem(type);
        return help;
    }

    getPipeHelp(type: string): string {
        const { help } = this.getPipeHelpItem(type);
        return help;
    }

    protected getActionHelpItem(type: string): HelpItem {
        const ActionClass = this.app.resolver.getActionClass(type);
        const text = ActionClass.$help.trim();
        const help = text ? sanitize(marked(text)) : '';

        return {
            label: ActionClass.$type,
            help,
        };
    }

    protected getPipeHelpItem(type: string): HelpItem {
        const PipeClass = this.app.resolver.getPipeClass(type);
        const text = PipeClass.$help.trim();
        const help = text ? sanitize(marked(text)) : '';

        return {
            label: PipeClass.$type,
            help,
        };
    }

    // Help Modal
    modalShown() {
        return !!this.helpItem;
    }

    showActionHelpModal(type: string) {
        this.helpItem = this.getActionHelpItem(type);
    }

    showPipeHelpModal(type: string) {
        this.helpItem = this.getPipeHelpItem(type);
    }

    hideModal() {
        this.helpItem = null;
    }
}

export interface HelpObject {
    type: string;
    text: string;
    html: string;
}

export interface HelpItem {
    label: string;
    help: string;
}

function sanitize(html: string) {
    return sanitizeHtml(html, {
        allowedTags: ['b', 'i', 'em', 'strong', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'hr', 'code', 'pre'],
    });
}
