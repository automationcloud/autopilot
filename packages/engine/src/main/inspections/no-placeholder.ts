import { InspectionReport, InspectionLevel, ActionInspection } from '../inspection';
import { Action } from '../action';

export class NoPlaceholders extends ActionInspection {

    *inspect(action: Action): Iterable<InspectionReport> {
        if (action.type === 'placeholder') {
            yield {
                name: 'no-placeholder',
                level: InspectionLevel.Error,
                message: `Placeholders are not allowed`,
            };
        }
    }

}
