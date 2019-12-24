export interface IWSTask<T> {
    time?: number;
    sendType: string;
    messageType: string;
    unRegisterType?: string;
    sendData?: T;
    isExpire?: boolean;
    mockFunc?(onmessage: (data: any) => void, sendData?: T): void;
    unRegisterFunc?(oldData?: T, newData?: T): T;
    registerFunc?(oldData?: T, newData?: T): T;
}
export interface IWSMockSetting {
    url: string;
    _id?: number;
    sender?: (data: any, task: IWSTask<any>) => any;
    receiver?: (data: any) => void;
}
export interface IWSMockConfig {
    CONNECTING_TIME: number;
    CLOSING_TIME: number;
    SEND_RATE: number;
}
