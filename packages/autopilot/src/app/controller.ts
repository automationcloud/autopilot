export interface Controller {
    init(): Promise<void>;
}

export interface ControllerDescriptor {
    class: ControllerClass;
    priority: number;
}

export interface ControllerOptions {
    priority?: number;
}

export const controllers: ControllerDescriptor[] = [];

export interface SessionLifecycleHandler {
    onSessionStart(): Promise<void>;
    onSessionFinish(): Promise<void>;
}

export interface ControllerClass {
    prototype: Controller;
}

export function controller(options: ControllerOptions = {}) {
    return (target: ControllerClass) => {
        controllers.push({
            class: target,
            priority: options.priority || 0,
        });
    };
}
