import { StatelessViewport } from '../../viewport';

export class AutomationCloudHelpViewport extends StatelessViewport {
    getViewportId(): string {
        return 'ac-help';
    }

    getViewportName(): string {
        return 'Help & Resources';
    }

    getViewportIcon(): string {
        return 'fas fa-question-circle';
    }
}
