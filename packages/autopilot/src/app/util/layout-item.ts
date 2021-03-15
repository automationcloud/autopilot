import { kebabToCamel } from './helpers';

export type LayoutItemType = 'viewport' | 'row' | 'column';
export type LayoutDirection = 'left' | 'right' | 'top' | 'bottom';

/**
 * Low level operations for layout management (move, reorder, etc.)
 */
export class LayoutItem {
    $parent!: LayoutItem | null;
    type: 'viewport' | 'row' | 'column';
    size: number = 0.5;
    children: LayoutItem[];
    viewportId: string | null = null;

    constructor($parent: LayoutItem | null, spec: any) {
        Object.defineProperties(this, {
            $parent: {
                value: $parent,
                enumerable: false,
                writable: true,
            },
        });

        const { type, size = 0.5, children = [], viewportId = null } = spec;
        this.type = type;
        this.size = size;
        this.children = children.map((c: any) => new LayoutItem(this, c));
        this.viewportId = viewportId ? kebabToCamel(viewportId) : null;
        this.repack();
    }

    root(): LayoutItem {
        if (!this.$parent) {
            return this;
        }
        return this.$parent.root();
    }

    contains(item: LayoutItem): boolean {
        if (this === item) {
            return true;
        }
        return this.children.some(c => c.contains(item));
    }

    removeChild(child: LayoutItem) {
        const index = this.children.findIndex(c => c === child);
        if (index > -1) {
            this.children.splice(index, 1);
        }
    }

    removeSelf() {
        if (this.$parent) {
            this.$parent.removeChild(this);
        }
    }

    canMove(onto: LayoutItem) {
        return this.$parent && !this.contains(onto);
    }

    moveOnto(onto: LayoutItem, dir: LayoutDirection) {
        if (!this.canMove(onto)) {
            throw new Error('Cannot move LayoutItem to specified location');
        }
        this.$parent!.removeChild(this);
        onto.splitWith(this, dir);
    }

    splitWith(neighbour: LayoutItem, dir: LayoutDirection) {
        const clone = new LayoutItem(this, {
            type: this.type,
            children: this.children,
            viewportId: this.viewportId,
            size: 0.5,
        });
        const isColumn = dir === 'top' || dir === 'bottom';
        const isFirst = dir === 'top' || dir === 'left';
        this.type = isColumn ? 'column' : 'row';
        this.children = isFirst ? [neighbour, clone] : [clone, neighbour];
        this.viewportId = null;
        neighbour.$parent = this;
    }

    repack(): void {
        if (this.type === 'viewport') {
            this.children = [];
            return;
        }
        this.viewportId = null;
        // Collapse single-child containers
        if (this.children.length === 1) {
            const child = this.children[0];
            this.type = child.type;
            this.children = child.children;
            this.viewportId = child.viewportId;
            for (const c of this.children) {
                c.$parent = this;
            }
            this.repack();
            return;
        }
        // Collapse row{A, row{B, C}, D} into row{A, B, C, D}
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child.type === this.type) {
                const children = child.children;
                children.forEach(c => {
                    c.size *= child.size;
                    c.$parent = this;
                });
                this.children.splice(i, 1, ...children);
                // start over
                i = 0;
            }
        }
        // Normalize children sizes
        const total = this.children.reduce((sum, c) => sum + c.size, 0);
        for (const child of this.children) {
            if (total > 0) {
                child.size = child.size / total;
            }
            child.repack();
        }
    }

    *searchByType(type: LayoutItemType): IterableIterator<LayoutItem> {
        if (this.type === type) {
            yield this;
        }
        for (const child of this.children) {
            yield* child.searchByType(type);
        }
    }

    getFirstViewport(): LayoutItem | null {
        return this.searchByType('viewport').next().value || null;
    }

    /**
     * Returns a viewport located in specified direction from current one.
     * This function is recursive, because it delegates to ancestors to find the
     * appropriate viewport.
     * It maps to keyboard navigation UX, with `dir` corresponding to arrow keys.
     */
    getViewportInDirection(dir: LayoutDirection, childIndex: number = 0): LayoutItem | null {
        const type = dir === 'left' || dir === 'right' ? 'row' : 'column';
        // When left/right direction requested, look for nearest ancestor row
        // When top/bottom direction requested, look for nearest ancestor column
        // If we find it, we then move to next/previous sibling (if it exists)
        // and return the first viewport found in there.
        if (this.type === type) {
            const index = dir === 'left' || dir === 'top' ? childIndex - 1 : childIndex + 1;
            const sibling = this.children[index];
            if (sibling) {
                // Find first viewport there and return it
                const v = sibling.getFirstViewport();
                if (v) {
                    return v;
                }
            }
        }
        // Search up the hierarchy
        if (this.$parent) {
            const i = this.$parent.children.indexOf(this);
            return this.$parent.getViewportInDirection(dir, i);
        }
        return null;
    }

}
