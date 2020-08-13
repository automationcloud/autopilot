export const sessionHandlers: Set<SessionConstructor> = new Set();

export interface SessionLifecycleHandler {
    onSessionStart(): Promise<void>;
    onSessionFinish(): Promise<void>;
}

export interface SessionConstructor {
    prototype: SessionLifecycleHandler;
}

export function SessionHandler() {
    return (target: SessionConstructor) => {
        sessionHandlers.add(target);
    };
}
