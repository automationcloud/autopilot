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

import { EditEntityCommand } from './cmd';
import { Script } from '@automationcloud/engine';
import { ScriptEditorViewport } from '.';

export class EditScriptCommand extends EditEntityCommand<Script> {
    static title = 'Edit Script';

    constructor(viewport: ScriptEditorViewport, key: string, value: any) {
        super(viewport, '', key, value);
    }

    validateEntity(entity: Script): boolean {
        return entity instanceof Script;
    }
}
