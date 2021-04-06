export type BubbleOrientation = 'top' | 'bottom' | 'left' | 'right';
export type BubbleAlignment = 'start' | 'middle' | 'end';

export interface Bubble {
    id: string;
    selector: string;
    orientation: BubbleOrientation;
    alignment: BubbleAlignment;
    onRemove?: () => void;
}
