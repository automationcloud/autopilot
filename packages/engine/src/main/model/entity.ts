/**
 * A base class for JSON-serialized script entity.
 *
 * Script, Context, Action, Pipe and others inherit from it to take advantage of unified JSON serialization
 * conventions (the identifiers starting with `$` or `_` are omitted).
 *
 * @public
 */
export abstract class Entity<P> {

    constructor(public $owner: P) {
    }

    /**
     * Entity type, used for reflection.
     *
     * @public
     */
    abstract get $entityType(): string;

    /**
     * Path component for building `$path` to this entity.
     *
     * @internal
     */
    abstract get $key(): string;

    /**
     * Constructs a JSON pointer to this entity.
     *
     * @public
     */
    get $path(): string {
        return this.$owner instanceof Entity ? this.$owner.$path + '/' + this.$key : '';
    }

    /**
     * Serializes this entity into JSON.
     *
     * The identifiers starting with `$` or `_` are omitted. A common convention
     * is to use these identifiers for demarcating volatile state, back-references and
     * other properties that should not be serialized.
     */
    toJSON(): any {
        const json: any = {};
        for (const key of Object.keys(this)) {
            if (key[0] === '$' || key[0] === '_') {
                continue;
            }
            json[key] = (this as any)[key];
        }
        return json;
    }
}
