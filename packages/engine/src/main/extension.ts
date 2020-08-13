import { ActionClass, Action } from './action';
import { Exception } from '@automationcloud/cdp';
import { PipeClass, Pipe } from './pipe';
import { promises as fs } from 'fs';
import glob from 'glob';
import path from 'path';
import semver from 'semver';
import tar from 'tar';
import { promisify } from 'util';
import { Engine } from './engine';
import { Container } from 'inversify';
import { InspectionClass, Inspection } from './inspection';

const globAsync = promisify(glob);

export interface ExtensionSpec {
    name: string;
    version: string;
    description: string;
    modules: string[];
    entrypoint?: string;
}

export interface ExtensionManifest {
    name: string;
    description: string;
    latestVersion: string;
    versions: string[];
}

export interface ExtensionVersion {
    name: string;
    version: string;
}

/**
 * @internal
 */
export class Extension {
    static async load(dir: string): Promise<Extension> {
        const spec = await this.loadExtensionSpec(dir);
        return new Extension(dir, spec);
    }

    actionClasses: ActionClass[] = [];
    pipeClasses: PipeClass[] = [];
    inspectionClasses: InspectionClass[] = [];

    protected _container: Container | null = null;

    constructor(public dir: string, public spec: ExtensionSpec) {}

    isVersionWithinRange(range: string) {
        return semver.satisfies(this.spec.version, range);
    }

    init(engine: Engine) {
        this._container = new Container({ skipBaseClassChecks: true });
        this._container.parent = engine.container;
        this.loadModulesSync();
        if (this.spec.entrypoint) {
            const entrypointPath = path.join(this.dir, this.spec.entrypoint)
            const { init } = require(entrypointPath);
            init(this._container, engine);
        }
    }

    destroy() {
        this.unloadModulesSync();
    }

    isInitialized() {
        return !!this._container;
    }

    get container(): Container {
        if (this._container) {
            return this._container;
        }
        throw new Exception({
            name: 'ExtensionNotInitialized',
            message: 'Extension needs to be initialized before accessing its container',
            retry: false,
        });
    }

    protected loadModulesSync() {
        this.actionClasses = [];
        this.pipeClasses = [];
        this.inspectionClasses = [];
        const files = Extension.expandFilePatternsSync(this.dir, this.spec.modules);
        const modules = files.map(f => {
            const fullPath = path.join(this.dir, f);
            return require(fullPath);
        });
        for (const module of modules) {
            for (const value of Object.values(module)) {
                if (this.isActionClass(value)) {
                    this.actionClasses.push(value);
                }
                if (this.isPipeClass(value)) {
                    this.pipeClasses.push(value);
                }
                if (this.isInspectionClass(value)) {
                    this.inspectionClasses.push(value);
                }
            }
        }
    }

    protected unloadModulesSync() {
        const modulePaths = Object.keys(require.cache);
        for (const path of modulePaths) {
            if (path.startsWith(this.dir)) {
                delete require.cache[path];
            }
        }
    }

    // TODO kinda hacky, see if we can use decorators for these
    protected isActionClass(val: any): val is ActionClass {
        return (
            typeof val === 'function' &&
            Action.isPrototypeOf(val) &&
            typeof val.$type === 'string' &&
            typeof val.prototype.exec === 'function'
        );
    }

    // TODO kinda hacky, see if we can use decorators for these
    protected isPipeClass(val: any): val is PipeClass {
        return (
            typeof val === 'function' &&
            Pipe.isPrototypeOf(val) &&
            typeof val.$type === 'string' &&
            typeof val.prototype.apply === 'function'
        );
    }

    // TODO kinda hacky, see if we can use decorators for these
    protected isInspectionClass(val: any): val is InspectionClass {
        return (
            typeof val === 'function' &&
            Inspection.isPrototypeOf(val) &&
            typeof val.prototype.inspect === 'function'
        );
    }

    static async loadExtensionSpec(dir: string): Promise<ExtensionSpec> {
        const pkg = await this.loadPackageJson(dir);
        const { name, version, description = '' } = pkg;
        const modules = pkg.extension?.modules ?? pkg.modules ?? [];
        const entrypoint = pkg.extension?.entrypoint;
        if (!(name && typeof name === 'string')) {
            throw new Exception({
                name: 'ExtensionLoadFailed',
                message: `Malformed extension: "name" should be non-empty string`,
                details: { name, version, description }
            });
        }
        if (!semver.valid(version)) {
            throw new Exception({
                name: 'ExtensionLoadFailed',
                message: `Malformed extension: "version" should be a correct semver`,
                details: { name, version, description }
            });
        }
        if (!(typeof description === 'string')) {
            throw new Exception({
                name: 'ExtensionLoadFailed',
                message: `Malformed extension: "description" should be string`,
                details: { name, version, description }
            });
        }
        if (!(Array.isArray(modules) && modules.every(_ => typeof _ === 'string'))) {
            throw new Exception({
                name: 'ExtensionLoadFailed',
                message: `Malformed extension: "modules" must be an array of glob patterns`,
                details: { name, version, description, modules }
            });
        }
        return { name, version, description, modules, entrypoint };
    }

    static async loadPackageJson(dir: string): Promise<any> {
        try {
            const packageJsonFile = path.join(dir, 'package.json');
            const pkg = await fs.readFile(packageJsonFile, 'utf-8');
            return JSON.parse(pkg);
        } catch (error) {
            const reason = error instanceof SyntaxError ? 'package.json is malformed' :
                error.code === 'ENOENT' ? 'package.json not found' : error.message;
            throw new Exception({
                name: 'ExtensionLoadFailed',
                message: `Cannot load extension: ${reason}`,
                details: {
                    dir,
                    error,
                }
            });
        }
    }

    static async packExtensionBundle(dir: string, tarballFile: string) {
        const pkg = await this.loadPackageJson(dir);
        const files = pkg.files as string[] || [];
        const modules = (pkg.extension?.modules ?? pkg.modules ?? []) as string[];
        const fileList = [
            ...new Set([
                'package.json',
                ...(await this.expandFilePatterns(dir, files)),
                ...(await this.expandFilePatterns(dir, modules)),
            ])
        ];
        const parentDir = path.dirname(tarballFile);
        await fs.mkdir(parentDir, { recursive: true });
        await tar.create(
            {
                file: tarballFile,
                cwd: dir,
            },
            fileList,
        );
    }

    static async expandFilePatterns(cwd: string, patterns: string[]) {
        const result: string[] = [];
        for (const pattern of patterns) {
            const files = await globAsync(pattern, { cwd });
            result.push(...files);
        }
        return result;
    }

    static expandFilePatternsSync(cwd: string, patterns: string[]) {
        const result: string[] = [];
        for (const pattern of patterns) {
            const files = glob.sync(pattern, { cwd });
            result.push(...files);
        }
        return result;
    }
}
