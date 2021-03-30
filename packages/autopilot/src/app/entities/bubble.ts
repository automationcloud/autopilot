export type BubbleArrowType = 'up' | 'down' | 'left' | 'right';

export interface Bubble {
    id: string;
    title: string;
    message: string[];
    arrow: BubbleArrowType;
    offset: {
        x: number;
        y: number;
    };

}

export interface NotificationAction {
    title: string;
    action: () => void | Promise<void>;
}
