import { StatelessViewport } from '../../viewport';

export class InspectionsViewport extends StatelessViewport {

    getViewportId(): string {
        return 'inspections';
    }

    getViewportName(): string {
        return 'Script Report';
    }

    getViewportIcon(): string {
        return 'fas fa-chart-pie';
    }

}
