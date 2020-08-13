import { StatelessViewport } from '../../viewport';

export class PlaybackEventsViewport extends StatelessViewport {
    getViewportId(): string {
        return 'playback-events';
    }

    getViewportName(): string {
        return 'Playback Events';
    }

    getViewportIcon(): string {
        return 'fas fa-exclamation-circle';
    }
}
