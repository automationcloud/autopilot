import { BrowserService } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';

import { controller } from '../controller';
import { EventsController } from '../controllers/events';
import { UserData } from '../userdata';
import { StorageController } from './storage';

const DEFAULT_OPTIONS: ScreencastOptions = {
    size: 'fit'
};

@injectable()
@controller({ alias: 'screencast' })
export class ScreencastController {
    userData: UserData;

    options: ScreencastOptions = DEFAULT_OPTIONS;
    clientWidth: number = 1;
    clientHeight: number = 1;
    button: number = -1;

    constructor(
        @inject(StorageController)
        storage: StorageController,
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(EventsController)
        protected events: EventsController,
    ) {
        this.userData = storage.createUserData('screencast');
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onScreencastFrame = this.onScreencastFrame.bind(this);
        this.browser.on('emulationInvalid', () => {
            // TODO find a better way
            // Note: this happens asynchronously
            setTimeout(() => this.initViewport(), 500);
        });
    }

    async init() {
        const options = await this.userData.loadData({});
        Object.assign(this.options, options);
    }

    update() {
        this.userData.saveData(this.options);
    }

    setOptions(options: Partial<ScreencastOptions>) {
        Object.assign(this.options, options);
        this.update();
    }

    async startScreencast() {
        try {
            const page = this.browser.page;
            page.target.addListener('Page.screencastFrame', this.onScreencastFrame);
            await page.send('Page.startScreencast', { format: 'jpeg' });
            await this.initViewport();
        } catch (err) {
            console.warn(err);
        }
    }

    async stopScreencast() {
        try {
            const page = this.browser.page;
            await page.send('Page.stopScreencast');
            page.target.removeListener('Page.screencastFrame', this.onScreencastFrame);
            // TODO unsubscribe
        } catch (err) {
            console.warn(err);
        }
    }

    async onScreencastFrame(frame: ScreencastFrame) {
        try {
            const page = this.browser.page;
            const { data, sessionId } = frame;
            this.events.emit('screencastFrameUpdated', data);
            await new Promise(r => requestAnimationFrame(r));
            await page.send('Page.screencastFrameAck', { sessionId });
        } catch (err) {
            console.warn(err);
            this.stopScreencast();
        }
    }

    async onMouseMove(ev: MouseEvent) {
        const page = this.browser.page;
        const { x, y } = this.getRemoteMousePos(ev);
        await page.send('Input.emulateTouchFromMouseEvent', {
            type: 'mouseMoved',
            x,
            y,
            button: this.getMouseButton(),
        });
    }

    async onMouseDown(ev: MouseEvent) {
        const page = this.browser.page;
        const { x, y } = this.getRemoteMousePos(ev);
        this.button = ev.button;
        await page.send('Input.emulateTouchFromMouseEvent', {
            type: 'mousePressed',
            x,
            y,
            button: this.getMouseButton(),
            clickCount: 1,
        });
    }

    async onMouseUp(ev: MouseEvent) {
        const page = this.browser.page;
        const { x, y } = this.getRemoteMousePos(ev);
        await page.send('Input.emulateTouchFromMouseEvent', {
            type: 'mouseReleased',
            x,
            y,
            button: this.getMouseButton(),
        });
        this.button = -1;
    }

    async onKeyDown(ev: KeyboardEvent) {
        const page = this.browser.page;
        const modifiers = this.getModifiersFlags(ev);
        await page.send('Input.dispatchKeyEvent', {
            type: 'keyDown',
            modifiers,
            autoRepeat: false,
            code: ev.code,
            key: ev.key,
            text: ev.key.length === 1 ? ev.key : '',
            nativeVirtualKeyCode: ev.keyCode,
            windowsVirtualKeyCode: ev.keyCode,
        });
    }

    async onKeyUp(ev: KeyboardEvent) {
        const page = this.browser.page;
        const modifiers = this.getModifiersFlags(ev);
        await page.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            modifiers,
            autoRepeat: false,
            code: ev.code,
            key: ev.key,
            nativeVirtualKeyCode: ev.keyCode,
            windowsVirtualKeyCode: ev.keyCode,
        });
    }

    protected getMouseButton() {
        switch (this.button) {
            case 0: return 'left';
            case 1: return 'middle';
            case 2: return 'right';
            case 3: return 'back';
            case 4: return 'forward';
            default: return 'none';
        }
    }

    protected getRemoteMousePos(ev: MouseEvent) {
        const { clientWidth, clientHeight } = ev.target as HTMLElement;
        const { offsetX, offsetY } = ev;
        return {
            x: Math.round(offsetX * this.clientWidth / clientWidth),
            y: Math.round(offsetY * this.clientHeight / clientHeight),
        };
    }

    protected async initViewport() {
        const page = this.browser.page;
        const { layoutViewport: { clientWidth, clientHeight } } = await page.getLayoutMetrics();
        this.clientWidth = clientWidth;
        this.clientHeight = clientHeight;
        await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    }

    protected getModifiersFlags(ev: KeyboardEvent) {
        return (ev.altKey ? 1 : 0) |
            (ev.ctrlKey ? 2 : 0) |
            (ev.metaKey ? 4 : 0) |
            (ev.shiftKey ? 8 : 0);
    }

}

export interface ScreencastOptions {
    size: 'fit' | 'scroll';
}

export interface ScreencastFrame {
    data: string;
    sessionId: number;
}
