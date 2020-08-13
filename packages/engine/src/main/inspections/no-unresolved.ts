import { InspectionReport, InspectionLevel, ActionInspection } from '../inspection';
import { Action } from '../action';

export class NoUnresolved extends ActionInspection {

    *inspect(action: Action): Iterable<InspectionReport> {
        if (action.type === 'unresolved') {
            yield {
                name: 'no-unresolved-action',
                level: InspectionLevel.Error,
                message: `Unresolved action: ${(action as any).$originalSpec?.type}`,
            };
        }
        for (const pipe of action.descendentPipes()) {
            if (pipe.type === 'unresolved') {
                yield {
                    name: 'no-unresolved-pipe',
                    level: InspectionLevel.Error,
                    message: `Unresolved pipe: ${(pipe as any).$originalSpec?.type}`,
                };
            }
        }
    }

}
