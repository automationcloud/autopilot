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

import { ScriptEditorViewport } from '.';
import { PastePipeCommand } from './cmd-paste-pipe';

export class InsertPipeRecipeCommand extends PastePipeCommand {
    static title = 'Insert Pipe Recipe';

    constructor(viewport: ScriptEditorViewport, specs: any[]) {
        super(viewport);
        this.specs = specs;
    }

    canExecute() {
        return this.viewport.getPipeInsertLocation() != null;
    }
}
