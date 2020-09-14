import { App } from '../app';
import { Context, Action, Script } from '@automationcloud/engine';

export interface PlaybackTimer {
    accumulator: number;
    tickAt: number;
}

export type PlaybackLogType =
    | 'playback'
    | 'context.enter'
    | 'context.leave'
    | 'action.start'
    | 'action.end'
    | 'input'
    | 'output'
    | 'success'
    | 'fail';

export interface PlaybackLogSpec {
    type: PlaybackLogType;
    context?: Context;
    action?: Action;
    output?: any;
    input?: any;
    error?: any;
    breakpointId?: string;
    playbackEvent?: 'pause' | 'playScript' | 'playContext' | 'playAction';
}

export interface PlaybackLog extends PlaybackLogSpec {
    timestamp: number;
}

export class PlaybackManager {
    app: App;
    timer!: PlaybackTimer;
    logs: PlaybackLog[] = [];
    breakpointIds: string[] = [];
    _timer: any = null;
    private _lastBreakpointId: string | null = null;

    constructor(app: App) {
        this.app = app;
        this.resetTimer();
    }

    get script() {
        return this.app.project.script;
    }
    get scriptFlow() {
        return this.app.viewports.scriptFlow;
    }

    isRunning() {
        return this.script.isRunning();
    }

    isPaused() {
        return this.script.isPaused();
    }

    getSelectedItem(): Script | Context | Action {
        return this.scriptFlow.getLastSelectedItem() || this.script;
    }

    selectItem(item: Action | Context) {
        this.scriptFlow.selectItem(item);
        this.scriptFlow.revealSelected();
    }

    pause() {
        if (!this.isRunning()) {
            return;
        }
        this.addLog({
            type: 'playback',
            playbackEvent: 'pause',
        });
        this.script.pause();
        this.stopTimer();
    }

    isCanPlayScript() {
        if (this.isRunning()) {
            return false;
        }
        return true; // Script playback is allowed even if nothing is selected
    }

    async playScript() {
        if (!this.isCanPlayScript()) {
            return;
        }
        this.addLog({
            type: 'playback',
            playbackEvent: 'playScript',
        });
        const selected = this.getSelectedItem();
        if (selected instanceof Script) {
            return await this.resetAndPlay();
        }
        if (selected instanceof Context) {
            selected.reset();
            await this.resumeFromAction('script', selected.children.first);
        }
        if (selected instanceof Action) {
            await this.resumeFromAction('script', selected);
        }
    }

    async resetAndPlay() {
        await this.reset();
        const mainContext = this.script.getMainContext();
        this.selectItem(mainContext);
        await this.playScript();
    }

    isCanPlayContext() {
        if (this.isRunning()) {
            return false;
        }
        return true;
    }

    async playContext() {
        if (!this.isCanPlayContext()) {
            return false;
        }
        this.addLog({
            type: 'playback',
            playbackEvent: 'playContext',
        });
        const selected = this.getSelectedItem();
        const playhead = selected instanceof Context ? selected.children.first :
            selected instanceof Action ? selected : this.script.getFirstAction();
        await this.resumeFromAction('context', playhead);
    }

    isCanPlayAction() {
        if (this.isRunning()) {
            return false;
        }
        const selected = this.getSelectedItem();
        return selected.$entityType === 'action';
    }

    async playAction(advance: boolean = false) {
        if (!this.isCanPlayAction()) {
            return false;
        }
        this.addLog({
            type: 'playback',
            playbackEvent: 'playAction',
        });
        const action = this.getSelectedItem() as Action;
        await this.resumeFromAction('action', action);
        if (advance) {
            await this.syncSelectionWithPlayhead();
        } else {
            this.selectItem(action);
        }
    }

    isCanMatchContexts() {
        return !this.isRunning();
    }

    async matchContexts() {
        if (!this.isCanMatchContexts()) {
            return;
        }
        await this.resumeFromAction('action', null);
        const { playhead } = this.script.$playback;
        if (playhead) {
            this.selectItem(playhead.$context);
        }
    }

    async resumeFromAction(mode: 'script' | 'context' | 'action', action: Action | null) {
        if (this.isRunning()) {
            return;
        }
        const scriptListeners = {
            'context.enter': (c: Context) => this.onContextEnter(c),
            'context.leave': (c: Context) => this.onContextLeave(c),
            'action.start': (a: Action) => this.onActionStart(a),
            'action.end': (a: Action) => this.onActionEnd(a),
            'beforeCurrentTask': () => (mode === 'action' ? {} : this.onBeforeCurrentTask()),
            'success': () => this.onSuccess(),
            'fail': (err: any) => this.onFail(err),
            'input': (input: any) => this.onInput(input),
            'output': (output: any) => this.onOutput(output),
        };
        try {
            for (const [k, fn] of Object.entries(scriptListeners)) {
                this.script.$events.addListener(k, fn);
            }
            this.resumeTimer();
            await this.script.run(mode, action);
            await this.syncSelectionWithPlayhead();
        } finally {
            this.stopTimer();
            for (const [k, fn] of Object.entries(scriptListeners)) {
                this.script.$events.removeListener(k, fn);
            }
        }
    }

    async syncSelectionWithPlayhead() {
        const { playhead } = this.script.$playback;
        if (playhead) {
            this.selectItem(playhead);
        } else {
            this.scriptFlow.clearSelection();
        }
    }

    async reset() {
        this.pause();
        if (this.app.browser.isAttached()) {
            try {
                await this.app.browser.page.clearBrowsingData();
                await this.app.browser.page.navigate('about:blank');
            } catch (err) {
                console.warn('Current target cleanup failed', err);
            }
        }
        await this.app.finishSession();
        await this.app.startSession();
        await this.app.project.init();
        this.app.expandable.collapseAll();
        this.scriptFlow.clearSelection();
        this.resetTimer();
        this.clearLogs();
    }

    jumpToPlayhead() {
        const { playhead } = this.script.$playback;
        if (playhead) {
            this.selectItem(playhead);
        }
    }

    // Timer

    getTimer() {
        const { accumulator } = this.timer;
        const mins = Math.floor(accumulator / 60000)
            .toString()
            .padStart(2, '0');
        const secs = Math.floor((accumulator % 60000) / 1000)
            .toString()
            .padStart(2, '0');
        const millis = (accumulator % 1000).toString().padStart(3, '0');
        return {
            accumulator,
            mins,
            secs,
            millis,
        };
    }

    resetTimer() {
        clearInterval(this._timer);
        this.timer = {
            accumulator: 0,
            tickAt: 0,
        };
    }

    resumeTimer() {
        this.timer.tickAt = Date.now();
        this._timer = setInterval(() => this.timerTick(), 87);
    }

    stopTimer() {
        clearInterval(this._timer);
        this.timerTick();
        this.timer.tickAt = 0;
    }

    timerTick() {
        const { timer } = this;
        if (timer.tickAt > 0) {
            timer.accumulator += Date.now() - timer.tickAt;
        }
        timer.tickAt = Date.now();
    }

    // Logs

    addLog(logSpec: PlaybackLogSpec) {
        this.logs.push({
            ...logSpec,
            timestamp: Date.now(),
        });
    }

    clearLogs() {
        this.logs = [];
    }

    // Breakpoints

    addBreakpoint(actionId: string) {
        this.breakpointIds.push(actionId);
    }

    removeBreakpoint(actionId: string) {
        this.breakpointIds = this.breakpointIds.filter(_ => _ !== actionId);
    }

    clearBreakpoints() {
        this.breakpointIds = [];
    }

    onContextEnter(context: Context) {
        this.selectItem(context);
        this.addLog({
            type: 'context.enter',
            context,
        });
    }

    onContextLeave(context: Context) {
        this.scriptFlow.clearSelection();
        this.addLog({
            type: 'context.leave',
            context,
        });
    }

    onActionStart(action: Action) {
        this.selectItem(action);
        this.addLog({
            type: 'action.start',
            action,
        });
    }

    onActionEnd(action: Action) {
        this.addLog({
            type: 'action.end',
            action,
        });
    }

    onSuccess() {
        this.addLog({
            type: 'success',
        });
    }

    onFail(error: any) {
        this.addLog({
            type: 'fail',
            error,
        });
    }

    onOutput(output: any) {
        this.addLog({
            type: 'output',
            output,
        });
    }

    onInput(input: any) {
        this.addLog({
            type: 'input',
            input,
        });
    }

    onBeforeCurrentTask() {
        const { playhead } = this.script.$playback;
        if (playhead && this.breakpointIds.includes(playhead.id)) {
            if (this._lastBreakpointId && this._lastBreakpointId === playhead.id) {
                this._lastBreakpointId = null;
                return;
            }
            this._lastBreakpointId = playhead.id;
            this.pause();
        }
    }
}
