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

import { StatelessViewport } from '../../viewport';
import { getConfigDeclarations, PropertyDecl } from '@automationcloud/engine';

export class SettingsViewport extends StatelessViewport {
    getViewportId(): string {
        return 'settings';
    }

    getViewportName(): string {
        return 'Settings';
    }

    getViewportIcon(): string {
        return 'fas fa-cog';
    }

    getAllEntries(): SettingsEntry[] {
        const results: SettingsEntry[] = [];
        const map: Map<string, string> = new Map(this.app.settings.entries);
        for (const [key, decl] of getConfigDeclarations().entries()) {
            const values = [
                { env: '', value: map.get(key) },
                { env: 'staging', value: map.get(key + ':staging') },
                { env: 'production', value: map.get(key + ':production') },
            ].filter(_ => _.value != null) as SettingsEntryValue[];
            const entry = { decl, values };
            results.push(entry);
        }
        return results.sort((a, b) => (a.decl.key > b.decl.key ? 1 : -1));
    }
}

export interface SettingsEntry {
    decl: PropertyDecl<any>;
    values: SettingsEntryValue[];
}

export interface SettingsEntryValue {
    env: string;
    value: string;
}
