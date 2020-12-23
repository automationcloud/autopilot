// Copyright 2020 UBIO Limited
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

import { injectable, inject } from 'inversify';
import { Extension, ExtensionVersion } from '../extension';
import { ActionClass, UnresolvedAction } from '../action';
import { PipeClass, UnresolvedPipe } from '../pipe';
import { Category } from '../model';
import { coreExtension } from '../core';
import { groupBy } from '../util';
import { Engine } from '../engine';

/**
 * @internal
 */
@injectable()
export class ResolverService {
    protected extensions: Extension[] = [];
    protected actionTypeMap: Map<string, ActionClass> | null = null;
    protected actionCategories: Category<ActionClass>[] | null = null;
    protected pipeTypeMap: Map<string, PipeClass> | null = null;
    protected pipeCategories: Category<PipeClass>[] | null = null;

    constructor(
        @inject(Engine)
        protected engine: Engine
    ) {
        coreExtension.init(this.engine);
    }

    getExtensions() {
        return [...this.extensions];
    }

    addExtension(ext: Extension) {
        this.removeExtension(ext);
        this.extensions.push(ext);
        ext.init(this.engine);
        this.invalidate();
    }

    removeExtension(ext: Extension) {
        const existing = this.extensions.filter(_ => _.spec.name === ext.spec.name);
        for (const ext of existing) {
            ext.destroy();
        }
        this.extensions = this.extensions.filter(_ => !existing.includes(_));
        this.invalidate();
    }

    purgeExtensions() {
        for (const ext of this.extensions) {
            ext.destroy();
        }
        this.extensions = [];
        this.invalidate();
    }

    getActionClass(type: string): ActionClass {
        const index = this.getActionIndex();
        return index.get(type) || UnresolvedAction;
    }

    getPipeClass(type: string): PipeClass {
        const index = this.getPipeIndex();
        return index.get(type) || UnresolvedPipe;
    }

    getActionIndex(): Map<string, ActionClass> {
        if (!this.actionTypeMap) {
            this.reindex();
        }
        return this.actionTypeMap!;
    }

    getActionCategories() {
        if (!this.actionCategories) {
            this.reindex();
        }
        return this.actionCategories!;
    }

    getPipeIndex(): Map<string, PipeClass> {
        if (!this.pipeTypeMap) {
            this.reindex();
        }
        return this.pipeTypeMap!;
    }

    getPipeCategories() {
        if (!this.pipeCategories) {
            this.reindex();
        }
        return this.pipeCategories!;
    }

    getInspectionClasses() {
        return this.getAllExtensions().flatMap(ext => ext.inspectionClasses);
    }

    *unmetDependencies(requirements: ExtensionVersion[]): Iterable<ExtensionVersion> {
        for (const required of requirements) {
            const ext = this.extensions.find(_ => _.spec.name === required.name);
            const satisfied = ext && ext.isVersionWithinRange(required.version);
            if (!satisfied) {
                yield required;
            }
        }
    }

    protected invalidate() {
        this.actionTypeMap = null;
        this.pipeTypeMap = null;
        this.actionCategories = null;
        this.pipeCategories = null;
    }

    protected reindex() {
        this.actionTypeMap = new Map();
        this.pipeTypeMap = new Map();
        for (const extension of this.getAllExtensions()) {
            for (const ActionClass of extension.actionClasses) {
                ActionClass.$extension = extension;
                this.actionTypeMap.set(ActionClass.$type, ActionClass);
            }
            for (const PipeClass of extension.pipeClasses) {
                PipeClass.$extension = extension;
                this.pipeTypeMap.set(PipeClass.$type, PipeClass);
            }
        }
        this.actionCategories = this.buildCategories([...this.actionTypeMap.values()]);
        this.pipeCategories = this.buildCategories([...this.pipeTypeMap.values()]);
    }

    protected getAllExtensions() {
        return [coreExtension, ...this.extensions];
    }

    protected buildCategories<T extends ActionClass | PipeClass>(items: T[]): Category<T>[] {
        return groupBy(items, cl => cl.$metadata.ns)
            .map(_ => {
                return {
                    name: _[0],
                    items: _[1].sort(by(_ => _.$type)),
                };
            })
            .sort(by(_ => _.name));
    }

}

function by<T, K>(fn: (item: T) => K): (a: T, b: T) => number {
    return (a, b) => (fn(a) > fn(b) ? 1 : -1);
}
