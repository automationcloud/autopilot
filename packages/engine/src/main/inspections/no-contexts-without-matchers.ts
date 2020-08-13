import { InspectionReport, InspectionLevel, ContextInspection } from '../inspection';
import { Context } from '../context';

export class NoContextsWithoutMatchers extends ContextInspection {

    *inspect(context: Context): Iterable<InspectionReport> {
        if (context.type !== 'context') {
            return;
        }
        if (context.matchers.length === 0) {
            yield {
                name: 'no-contexts-without-matchers',
                level: InspectionLevel.Error,
                message: `Context should have at least 1 matcher`,
            };
        }
    }

}
