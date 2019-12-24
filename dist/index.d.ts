import { IWSTask, IWSMockSetting, IWSMockConfig } from './type';
export { IWSTask };
export default class WsMock {
    static config(config: IWSMockConfig): void;
    static configs: {
        CONNECTING_TIME: number;
        CLOSING_TIME: number;
        SEND_RATE: number;
    };
    constructor(settings: IWSMockSetting);
    private timer;
    private url;
    private setting;
    private sender;
    private receiver;
    private timeLineTask;
    private IWSTaskList;
    private sendTypeMap;
    private unRegisterTypeMap;
    start: () => void;
    addTask: <T>(task: IWSTask<T>) => void;
    close: () => void;
    sendMsg: (type: string, data: any) => void;
    private addTimeLineTask;
    private _sender;
    private _receiver;
    private execute;
    private removeTask;
}
