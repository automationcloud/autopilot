// Copyright 2020 Ubio Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
