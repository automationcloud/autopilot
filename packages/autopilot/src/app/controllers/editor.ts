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

import { ResolverService } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';

import { controller } from '../controller';

/**
 * A controller with ambitious name but not too much logic currently.
 *
 * TODO The bigger idea is to actually transfer the selection and editing functionality
 * from ScriptFlowViewport and ScriptEditorViewport, so that the whole thing is decoupled.
 */
@injectable()
@controller({
    alias: 'editor'
})
export class EditorController {

    constructor(
        @inject(ResolverService)
        protected resolver: ResolverService,
    ) {

    }

    async init() {}

    getActionIcon(type: string) {
        const ActionClass = this.resolver.getActionClass(type);
        return ActionClass.$icon || 'far fa-circle';
    }

}
