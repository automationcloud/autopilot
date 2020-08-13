import { ObjectWithId, IdDatabase } from './commons';
import { Entity } from './entity';
import { Exception } from '@automationcloud/cdp';

/**
 * A typed list of script entities.
 *
 * This class supports typed editing operations such as `create`, `insert`, `remove`
 * and re-implements some common Array functionality for easier access to underlying array data.
 *
 * Entities belonging to typed lists are capable of constructing JSON pointers to self.
 *
 * @internal
 */
export abstract class EntityList<P extends Entity<any>, T extends ObjectWithId> extends Entity<P> {
    $key: string;
    items: T[] = [];

    constructor(
        $owner: P,
        $key: string,
        specs: any
    ) {
        super($owner);
        this.$key = $key;
        const specItems = Array.isArray(specs) ? specs : specs?.items || [];
        for (const spec of specItems) {
            this.insert(spec);
        }
    }

    abstract get $entityType(): string;
    abstract $idDatabase: IdDatabase;
    abstract create(spec: any): T;

    toJSON() {
        return { items: this.items };
    }

    get $path(): string {
        return this.$owner.$path + '/' + this.$key;
    }

    *[Symbol.iterator](): IterableIterator<T> {
        yield* this.items;
    }

    get length(): number {
        return this.items.length;
    }

    indexOf(item: T): number {
        return this.items.indexOf(item);
    }

    get first(): T | null {
        return this.items[0] || null;
    }

    get last(): T | null {
        return this.items[this.length - 1] || null;
    }

    get(index: number): T | null {
        return this.items[index] || null;
    }

    find(predicate: (item: T, index: number) => boolean): T | null {
        return this.items.find(predicate) || null;
    }

    filter(predicate: (item: T, index: number) => boolean): T[] {
        return this.items.filter(predicate);
    }

    map<K>(fn: (item: T, index: number) => K): K[] {
        return this.items.map(fn);
    }

    *previousSiblings(item: T): IterableIterator<T> {
        const index = this.indexOf(item);
        for (let i = index - 1; i >= 0; i -= 1) {
            yield this.items[i];
        }
    }

    *nextSiblings(item: T): IterableIterator<T> {
        const index = this.indexOf(item);
        for (let i = index + 1; i < this.length; i += 1) {
            yield this.items[i];
        }
    }

    previousSibling(item: T): T | null {
        return this.previousSiblings(item).next().value;
    }

    nextSibling(item: T): T | null {
        return this.nextSiblings(item).next().value;
    }

    // Mutations

    insert(spec: any, index: number = this.length): T {
        index = Math.max(0, Math.min(index, this.length));
        const item = this.create(spec);
        this.items.splice(index, 0, item);
        this.$idDatabase.registerId(item.id, item);
        return item;
    }

    removeAt(index: number) {
        const item = this.get(index);
        if (index > -1 && item) {
            this.items.splice(index, 1);
            this.unregisterIds(item);
        }
    }

    remove(item: T) {
        this.removeAt(this.indexOf(item));
    }

    removeWhere(predicate: (item: T, index: number) => boolean) {
        for (let i = 0; i < this.length; i += 1) {
            const item = this.items[i];
            if (predicate(item, i)) {
                this.items.splice(i, 1);
                this.unregisterIds(item);
                i -= 1;
            }
        }
    }

    replace(item: T, newSpec: any): T {
        const i = this.indexOf(item);
        if (i > -1) {
            this.unregisterIds(item);
            const newItem = this.create(newSpec);
            this.items.splice(i, 1, newItem);
            return newItem;
        }
        throw new Exception({
            name: 'IllegalManipulation',
            message: 'Could not replace node: source node not found',
            retry: false,
        });
    }

    move(item: T, newIndex: number) {
        const oldIndex = this.indexOf(item);
        this.items.splice(oldIndex, 1);
        this.items.splice(newIndex, 0, item);
    }

    protected unregisterIds(item: T) {
        const ids = this.collectIds(item);
        for (const id of ids) {
            this.$idDatabase.unregisterId(id);
        }
    }

    protected collectIds(obj: any): Set<string> {
        const ids: Set<string> = new Set();
        JSON.stringify(obj, (k, v) => {
            if (k === 'id') {
                ids.add(v);
            }
            return v;
        });
        return ids;
    }
}
