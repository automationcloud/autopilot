import { StatelessViewport } from '../../viewport';

export class SpeedViewport extends StatelessViewport {
    getViewportId(): string {
        return 'speed';
    }

    getViewportName(): string {
        return 'Speed';
    }

    getViewportIcon(): string {
        return 'fas fa-rocket';
    }
}
