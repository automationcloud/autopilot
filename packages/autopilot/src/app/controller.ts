export interface Controller {
    init(): Promise<void>;
}

export interface ControllerConfig {
    priority: number;
    backgroundInit: boolean;
}

export type ControllerDescriptor = {
    class: ControllerClass;
} & ControllerConfig;

export const controllers: ControllerDescriptor[] = [];

export interface SessionLifecycleHandler {
    onSessionStart(): Promise<void>;
    onSessionFinish(): Promise<void>;
}

export interface ControllerClass {
    prototype: Controller;
}

export function controller(options: Partial<ControllerConfig> = {}) {
    return (target: ControllerClass) => {
        controllers.push({
            class: target,
            priority: options.priority ?? 0,
            backgroundInit: options.backgroundInit ?? false,
        });
    };
}
