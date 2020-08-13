import { StatelessViewport } from '../../viewport';

export class ExtensionsViewport extends StatelessViewport {

    getViewportId(): string {
        return 'extensions';
    }

    getViewportName(): string {
        return 'Extensions';
    }

    getViewportIcon(): string {
        return 'fas fa-puzzle-piece';
    }

}
