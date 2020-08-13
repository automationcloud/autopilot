import jsonPointer from 'jsonpointer';
import { checkType } from './data';
import vm from 'vm';
import fetch from 'node-fetch';
import { setTimeout, clearTimeout, setInterval, clearInterval, setImmediate, clearImmediate } from 'timers';
import * as util from '../util';

const globals = ['module', 'exports', 'require', 'global', 'process'];

export function evalExpression(expression: string, scope: any, additionalArgs: object = {}) {
    switch (expression[0]) {
        case '/':
            checkType(scope, ['object', 'array']);
            return jsonPointer.get(scope, expression);
        case '=': {
            const _this = util.deepClone(scope);
            const entries = Object.entries(_this)
                .filter(ent => /^[a-z][a-z0-9_]*$/i.test(ent[0]))
                .concat(Object.entries(additionalArgs));
            const keys = entries.map(_ => _[0]);
            const values = entries.map(_ => _[1]);
            const js = compileSyncJs(`return ${expression.substring(1)}`, ...keys);
            const result = js.apply(_this, values);
            return result;
            // const js = new vm.Script(`$result = ${expression.substring(1)}`);
            // const sandbox = deepClone(scope);
            // js.runInNewContext(sandbox);
            // return sandbox.$result;
        }
        default:
            return String(expression);
    }
}

// tslint:disable-next-line ban-types
export function compileSyncJs(expr: string, ...args: string[]): Function {
    return new Function(...args, `return (() => { ${expr} })(${args.join(',')})`);
}

// tslint:disable-next-line ban-types
export function compileAsyncJs(expr: string, ...args: string[]): Function {
    return new Function(...args, `return (async (${globals.join(',')}) => { ${expr} })(${args.join(',')})`);
}

export function compileJavaScript(code: string, timeout: number = 60000) {
    return new vm.Script(`$promise = (async (${globals.join(',')}) => { ${code} })()`, { timeout });
}

export function invokeJavaScript(script: vm.Script, args: object): Promise<any> {
    const sandbox = {
        $promise: null as any,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        setImmediate,
        clearImmediate,
        URL,
        URLSearchParams,
        Buffer,
        fetch,
        console,
        ...args,
    };
    script.runInNewContext(sandbox);
    return sandbox.$promise;
}
