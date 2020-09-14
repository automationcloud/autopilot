import { App } from '../app';
import { UserData } from '../userdata';
import { Script, Engine, ResolverService } from '@automationcloud/engine';
import { helpers } from '../util';
import path from 'path';
import moment from 'moment';
import { promises as fs } from 'fs';
import rimraf from 'rimraf';
import { promisify } from 'util';
import { ScriptDiffController } from './script-diff';
import { inject, injectable } from 'inversify';
import { StorageController } from './storage';
import { controller } from '../controller';
import { EventBus } from '../event-bus';
import { DatasetsController } from './datasets';

const rimrafAsync = promisify(rimraf);

const DIALOG_FILTERS = [
    { name: 'UB Automation', extensions: ['ubscript', 'json', 'json5'] },
    { name: 'All Files', extensions: ['*'] },
];

export const DEFAULT_METADATA: ProjectMetadata = {
    domainId: 'Generic',
    draft: true,
    scriptId: null,
    serviceId: null,
};

@injectable()
@controller()
export class ProjectController {
    userData: UserData;

    filePath!: string | null;
    script!: Script;
    metadata: ProjectMetadata = { ...DEFAULT_METADATA };

    autosaveFiles: string[] = [];
    autosaveLimit: number = 50;

    initialized: boolean = false;

    constructor(
        @inject('App')
        protected app: App,
        @inject(Engine)
        protected engine: Engine,
        @inject(StorageController)
        protected storage: StorageController,
        @inject(ScriptDiffController)
        protected diff: ScriptDiffController,
        @inject(ResolverService)
        protected resolver: ResolverService,
        @inject(EventBus)
        protected events: EventBus,
        @inject(DatasetsController)
        protected datasets: DatasetsController,
    ) {
        this.userData = storage.createUserData('project-manager', 300);
        events.on('projectInvalidated', () => {
            // Only invalidate after it was already initialized
            if (this.initialized) {
                this.init();
            }
        });
    }

    async init() {
        const { filePath = null, script, metadata } = await this.userData.loadData();
        this.filePath = filePath;
        this.initScript(script);
        this.metadata = { ...DEFAULT_METADATA, ...metadata };
        await this.initAutosave();
        this.initialized = true;
        this.events.emit('feedbackInvalidated');
    }

    async initAutosave() {
        await fs.mkdir(this.autosaveDir, { recursive: true });
        const files = (await fs.readdir(this.autosaveDir))
            .filter(_ => _.endsWith('.json'));
        const stats = await Promise.all(files.map(f => fs.stat(path.join(this.autosaveDir, f))));
        this.autosaveFiles = files
            .map((filename, i) => {
                return {
                    filename,
                    mtime: stats[i].mtime.getDate(),
                };
            })
            .sort((f1, f2) => (f1.mtime > f2.mtime ? 1 : -1))
            .map(f => f.filename);
    }

    update() {
        this.userData.update({
            filePath: this.filePath,
            script: this.script,
            metadata: this.metadata,
        });
    }

    get autosaveDir() {
        return this.storage.getFilename('autosave');
    }

    serializeProjectState() {
        return {
            script: this.script.toJSON(),
            datasets: this.datasets.datasets.filter(ds => !ds.excluded),
            metadata: this.metadata,
        };
    }

    initScript(json: any) {
        this.script = new Script(this.engine, json || {});
        // TODO emit events, subscribe in viewports
        this.app.viewports.scriptFlow.commandBuffer.reset();
        this.app.viewports.scriptEditor.commandBuffer.reset();
        this.app.viewports.datasets.commandBuffer.reset();
        this.app.viewports.scriptFlow.search.performSearch();
        // TODO this is "experimental" (in other words, corners cut for rapid prototyping purposes)
        const unmetDeps = [...this.resolver.unmetDependencies(this.script.dependencies)];
        if (unmetDeps.length) {
            const list = unmetDeps.map(dep => `- ${dep.name}:${dep.version}`).join('\n');
            alert(`Script has following unmet dependencies:\n\n${list}\n\nIt may not work as expected.`);
        }
    }

    async newProject() {
        this.filePath = null;
        this.loadFromJson({
            script: {},
            datasets: [],
            metadata: DEFAULT_METADATA,
        });
        this.update();
    }

    async openProject() {
        const filePaths = await helpers.showOpenDialog({
            title: 'Open Project',
            filters: DIALOG_FILTERS,
            properties: ['openFile'],
        });
        if (filePaths.length === 0) {
            return;
        }
        const file = filePaths[0];
        await this.loadFromFile(file, { filePath: file });
    }

    async saveProject() {
        return this.filePath ? await this.saveToFile(this.filePath) : await this.saveProjectAs();
    }

    async saveProjectAs() {
        const filePath = await helpers.showSaveDialog({
            title: 'Save Project',
            filters: DIALOG_FILTERS,
        });
        if (filePath == null) {
            return;
        }
        await this.saveToFile(filePath);
    }

    async loadFromFile(filePath: string, options: ProjectLoadOptions = {}) {
        try {
            const text = await fs.readFile(filePath, 'utf-8');
            const json = JSON.parse(text);
            await this.loadFromJson(json, options);
        } catch (e) {
            console.error('Load failed', e);
            alert('Load failed. Please check console for details.');
        }
    }

    async loadFromJson(json: any, options: ProjectLoadOptions = {}) {
        const { setDiffBase = true, autosave = true, filePath = null } = options;
        try {
            if (autosave) {
                await this.autosave();
            }
            this.initScript(json.script);
            if (setDiffBase) {
                this.diff.setNewBase(json.script);
            }
            if (json.datasets) {
                this.datasets.loadDatasets(json.datasets);
            }
            Object.assign(this.metadata, json.metadata);
            this.filePath = filePath;
            this.update();
        } catch (e) {
            console.error('Load failed', e);
            alert('Load failed. Please check console for details.');
        }
    }

    async saveToFile(filePath: string) {
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.ubscript') {
            filePath = filePath + '.ubscript';
        }
        try {
            const serialized = JSON.stringify(this.serializeProjectState());
            await fs.writeFile(filePath, serialized, 'utf-8');
            this.filePath = filePath;
            this.diff.setNewBase(this.script);
        } catch (e) {
            console.error('Save failed', e);
            alert('Save failed. Please check console for details.');
        }
    }

    async autosave() {
        const script = this.script;
        const state = this.serializeProjectState();
        const newFile =
            moment.utc().format('YYYY-MM-DD_HH-mm-ss_SSS_') +
            script.name.toLowerCase().replace(/[^a-z0-9]/g, '-') +
            '.json';
        await fs.mkdir(this.autosaveDir, { recursive: true });
        await fs.writeFile(path.join(this.autosaveDir, newFile), JSON.stringify(state), 'utf-8');
        await this.pruneAutosave();
    }

    async pruneAutosave() {
        await this.init();
        const toRemove = this.autosaveFiles.slice(this.autosaveLimit);
        for (const file of toRemove) {
            console.info('Removing old autosave file', file);
            await rimrafAsync(path.join(this.autosaveDir, file));
        }
    }

    async restoreAutosave(filename: string) {
        try {
            const file = path.join(this.autosaveDir, filename);
            await this.loadFromFile(file, {
                filePath: '',
                autosave: true,
            });
        } catch (err) {
            alert('Failed to load autosaved project. See Console for more info.');
            console.error(err);
        }
    }
}

export interface ProjectMetadata {
    domainId: string;
    draft: boolean;
    serviceId: string | null;
    scriptId: string | null;
}

export interface ProjectLoadOptions {
    setDiffBase?: boolean;
    autosave?: boolean;
    filePath?: string;
}
