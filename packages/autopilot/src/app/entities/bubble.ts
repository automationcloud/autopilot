export type BubbleArrowDirection = 'up' | 'down' | 'left' | 'right';

export interface Bubble {
    id: string;
    title: string;
    message: string[];
    arrowDirection: BubbleArrowDirection;
    arrowStyle: string;
    offset: {
        x: number;
        y: number;
    };

}

export interface NotificationAction {
    title: string;
    action: () => void | Promise<void>;
}
