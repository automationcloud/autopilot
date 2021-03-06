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

import { Module } from '@automationcloud/engine';
import { MenuItemConstructorOptions, remote } from 'electron';

import { ModalMenuItem } from '../controllers/modal-menu';

const { Menu } = remote;

export function popupMenu(menuItems: MenuItemConstructorOptions[]) {
    const menu = Menu.buildFromTemplate(menuItems);
    menu.popup({
        window: remote.getCurrentWindow(),
    });
}

export function *buildMenuItems<T extends Module>(
    prefix: string,
    items: Array<T>,
    itemFn: (item: T) => Partial<ModalMenuItem>,
): IterableIterator<ModalMenuItem> {
    const itemsForSubmenu = [];
    const subMenuLabels = new Set<string>();

    const path = prefix + '.';
    for (const item of items.filter(_ => _.$type.startsWith(path))) {
        const name = item.$type.replace(path, '');

        // no more depth, push the actual action, not submenu
        if (!name.includes('.')) {
            yield {
                ...itemFn(item),
                label: item.$type,
                htmlLabel: createLabel(item),
                deprecated: item.$deprecated,
            };
        } else {
            // next chunk of word becomes submenu label (e.g. Fetch.get => label: Fetch)
            const label = name.substring(0, name.indexOf('.'));
            subMenuLabels.add(label);
            itemsForSubmenu.push(item);
        }
    }
    const labels = [...subMenuLabels].sort((a, b) => { return a > b ? 1 : -1; });
    for (const label of labels) {
        yield {
            label,
            submenu: [...buildMenuItems(prefix + '.' + label, itemsForSubmenu, itemFn)]
        };
    }
}

export function createLabel<T extends Module>(module: T) {
    const { ns, method } = module.$metadata;
    if (method.indexOf('.') === -1) {
        // non nested items will display full name with styling
        return `<span class="subtle">${ns}.</span>${method}`;
    }

    // nested items will display the last chunk of name
    return method.substring(method.lastIndexOf('.') + 1);
}
