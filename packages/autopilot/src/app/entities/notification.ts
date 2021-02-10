export type NotificationType = 'info' | 'warn' | 'error' | 'fatal';
export type NotificationStyle = 'float' | 'stretch';

export interface Notification {
    id: string;
    kind: string;
    title: string;
    message: string;
    icon: string;
    level: NotificationType;
    style: NotificationStyle;
    canClose: boolean;
    timeout: number;
    primaryAction?: NotificationAction;
    secondaryAction?: NotificationAction;
}

export interface NotificationAction {
    title: string;
    action: () => Promise<void>;
}
