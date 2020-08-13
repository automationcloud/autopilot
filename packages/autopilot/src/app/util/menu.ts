import { remote, MenuItemConstructorOptions } from 'electron';

const { Menu } = remote;

export function popupMenu(menuItems: MenuItemConstructorOptions[]) {
    const menu = Menu.buildFromTemplate(menuItems);
    menu.popup({
        window: remote.getCurrentWindow(),
    });
}
