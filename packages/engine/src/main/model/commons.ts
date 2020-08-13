/**
 * @internal
 */
export interface ObjectWithId {
    id: string;
}

/**
 * @internal
 */
export interface IdDatabase {
    registerId(id: string, object: any): void;
    unregisterId(id: string): void;
}

/**
 * @public
 */
export interface Category<T> {
    name: string;
    items: T[];
}
