import { StatelessViewport } from '../../viewport';

export class BrowserViewport extends StatelessViewport {
    getViewportId(): string {
        return 'browser';
    }

    getViewportName(): string {
        return 'Browser';
    }

    getViewportIcon(): string {
        return 'fab fa-chrome';
    }
}
