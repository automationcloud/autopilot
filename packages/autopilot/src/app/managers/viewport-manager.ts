import { App } from '../app';
import {
    ApiViewport,
    BrowserViewport,
    DatasetsViewport,
    ExtensionsViewport,
    InspectionsViewport,
    PlaybackEventsViewport,
    RecipesViewport,
    ScriptEditorViewport,
    ScriptFlowViewport,
    SearchScriptsViewport,
    SettingsViewport,
} from '../viewports';
import { Viewport } from '../viewport';
import { LayoutDirection } from './layout-manager';

export class ViewportManager {
    app: App;
    api: ApiViewport;
    browserViewport: BrowserViewport;
    datasets: DatasetsViewport;
    extensions: ExtensionsViewport;
    inspections: InspectionsViewport;
    playbackEvents: PlaybackEventsViewport;
    recipes: RecipesViewport;
    scriptEditor: ScriptEditorViewport;
    scriptFlow: ScriptFlowViewport;
    searchScripts: SearchScriptsViewport;
    settings: SettingsViewport;
    // speed: SpeedViewport;

    all: Array<Viewport<any>>;

    activeViewportId: string = '';

    constructor(app: App) {
        this.app = app;
        // Note: this order determines the order in which buttons appear;
        // TODO do it better next time we touch this (i.e. when viewport controllers no longer exist)
        this.scriptFlow = new ScriptFlowViewport(app);
        this.scriptEditor = new ScriptEditorViewport(app);
        this.datasets = new DatasetsViewport(app);
        this.api = new ApiViewport(app);
        this.extensions = new ExtensionsViewport(app);
        this.inspections = new InspectionsViewport(app);
        this.playbackEvents = new PlaybackEventsViewport(app);
        // this.speed = new SpeedViewport(app);
        this.recipes = new RecipesViewport(app);
        this.searchScripts = new SearchScriptsViewport(app);
        this.settings = new SettingsViewport(app);
        this.browserViewport = new BrowserViewport(app);

        this.all = Object.values(this).filter(_ => _ instanceof Viewport);
    }

    async init() {
        for (const viewport of this.all) {
            await viewport.init();
        }
        this.activateCycle();
    }

    get(viewportId: string): Viewport<any> | null {
        return this.all.find(v => v.getViewportId() === viewportId) || null;
    }

    isActive(viewportId: string) {
        return this.activeViewportId === viewportId;
    }

    getActive(): Viewport<any> | null {
        const visible = this.app.layout.findByViewportId(this.activeViewportId) != null;
        return visible ? this.get(this.activeViewportId) : null;
    }

    activate(viewportId: string) {
        if (this.activeViewportId === viewportId) {
            return;
        }
        this.activateWorkspaceForViewport(viewportId);
        this.activeViewportId = viewportId;
        this.app.events.emit('activeViewportChanged');
        this.focusActive();
    }

    activateInDirection(dir: LayoutDirection) {
        const activeViewportItem = this.app.layout.findByViewportId(this.activeViewportId);
        if (!activeViewportItem) {
            return;
        }
        const nextViewport = activeViewportItem.getViewportInDirection(dir);
        if (nextViewport) {
            this.activate(nextViewport.viewportId!);
        }
    }

    activateCycle(forward: boolean = true) {
        const visibleIds = this.app.layout.getViewportIds();
        const i = visibleIds.indexOf(this.activeViewportId);
        const newIndex = ((forward ? i + 1 : i - 1) + visibleIds.length) % visibleIds.length;
        this.activate(visibleIds[newIndex]);
    }

    focusActive(force: boolean = false) {
        const viewport = this.getActive();
        if (!viewport) {
            return;
        }
        viewport.focus(force);
    }

    activateWorkspaceForViewport(viewportId: string) {
        const viewportItem = this.app.layout.findByViewportId(viewportId);
        if (!viewportItem) {
            const workspaceIndex = this.app.layout.findWorkspaceByViewport(viewportId);
            if (workspaceIndex > -1) {
                this.app.layout.activateWorkspace(workspaceIndex);
            }
        }
    }
}
