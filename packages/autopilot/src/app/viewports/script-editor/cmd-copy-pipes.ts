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

import { Command } from '../../command';
import { ScriptEditorViewport } from '.';
import { clipboard } from '../../util';

export class CopyPipeCommand extends Command<ScriptEditorViewport> {
    static title = 'Copy';

    isUndoable() {
        return false;
    }

    canExecute() {
        return this.viewport.getSelectedItems().length > 0;
    }

    protected async apply() {
        const items = this.viewport.getSelectedItems();
        clipboard.writeObject({
            type: 'pipes',
            data: items,
        });
        console.info(`Copied ${items.length} pipes to clipboard`);
    }

    protected async unapply() {}
}
