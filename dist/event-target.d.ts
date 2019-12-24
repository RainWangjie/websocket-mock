/**
 * Simple event dispatching system
 * See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget#Example
 */
declare type Listener = Array<(event: any) => void>;
export default class MyEventTarget {
    listeners: {
        [type: string]: Listener;
    };
    constructor();
    addEventListener(type: string, callback: (event: any) => void): number;
    removeEventListener(type: string, callback: () => void): void;
    dispatchEvent(event: any): boolean;
    modifyHandler(type: string, index: number, newHandler: () => void): void;
    removeAllListeners(): void;
}
export {};
