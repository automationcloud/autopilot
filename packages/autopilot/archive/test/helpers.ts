import { Script } from '@automationcloud/engine';

export function* collectHierarchy(script: Script, ...ids: string[]): IterableIterator<[string, string, string]> {
    for (const context of script.contexts) {
        yield [context.$owner.$path, ids.includes(context.id) ? '<new>' : context.id, context.type];
        for (const action of context.descendentActions()) {
            yield [action.$owner.$path, ids.includes(action.id) ? '<new>' : action.id, action.type];
        }
    }
}
