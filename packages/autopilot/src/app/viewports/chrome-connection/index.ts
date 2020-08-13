import { StatelessViewport } from '../../viewport';

export class ChromeConnectionViewport extends StatelessViewport {
    getViewportId(): string {
        return 'chrome-connection';
    }

    getViewportName(): string {
        return 'Chrome Connection';
    }

    getViewportIcon(): string {
        return 'fab fa-chrome';
    }
}
