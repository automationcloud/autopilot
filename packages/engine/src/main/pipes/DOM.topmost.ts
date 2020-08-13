import { Pipe } from '../pipe';
import { Element } from '../element';

export class FindTopmost extends Pipe {
    static $type = 'DOM.topmost';
    static $help = ``;

    async apply(inputSet: Element[]): Promise<Element[]> {
        const zIndexes = await Promise.all(inputSet.map(el => el.evaluateJson((el: HTMLElement) => {
            let max = 0;
            while (el.offsetParent) {
                const z = parseInt(window.getComputedStyle(el).getPropertyValue('z-index'));
                if (z && z > max) {
                    max = z;
                }
                el = el.offsetParent as HTMLElement;
            }
            const z = parseInt(window.getComputedStyle(el).getPropertyValue('z-index'));
            if (z && z > max) {
                max = z;
            }
            return max;
        })));
        const zipped: Array<[Element, number]> = inputSet.map((el, i) => [el, zIndexes[i]]);
        const sortedEls = zipped
            .sort((a, b) => a[1] > b[1] ? 1 : -1)
            .map(zip => zip[0]);
        return [sortedEls[0]];
    }
}
