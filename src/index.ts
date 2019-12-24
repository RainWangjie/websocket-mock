import { IWSTask, IWSMockSetting, IWSMockConfig } from "./type";
import { procSentData, isUrlMatched, getCurrent } from "./utils";
import _eventBus from "./event-bus";
import WebSocket from "./websocket";
import { storeMock } from "./mock-store";

if (!window["WebSocket"]) {
  throw new Error("Your browser does not support WebSocket.");
} else {
  // @ts-ignore
  window["WebSocket"] = WebSocket;
}

let _id = 0;

export { IWSTask };

// Class to be exported
export default class WsMock {
  static config(config: IWSMockConfig) {
    Object.assign(WsMock.config, config);
  }

  static configs = {
    CONNECTING_TIME: 100,
    CLOSING_TIME: 100,
    SEND_RATE: 1 * 1024 * 1024
  };

  constructor(settings: IWSMockSetting) {
    if (!settings.url) {
      console.log("Url must be specified.");
      return;
    }
    this.setting = settings;
    this.url = settings.url;
    this.sender = settings.sender || this._sender;
    this.receiver = settings.receiver || this._receiver;

    settings._id = _id++;

    // 更新mock store
    storeMock(settings);
  }

  private timer: number;
  private url: string;
  private setting: IWSMockSetting;
  private sender: IWSMockSetting["sender"];
  private receiver: IWSMockSetting["receiver"];

  // 事件队列
  private timeLineTask: {
    [time: number]: Array<IWSTask<any>>;
  } = {};

  // task存储
  private IWSTaskList: Array<IWSTask<any>> = [];
  private sendTypeMap: { [sendType: string]: number } = {};
  private unRegisterTypeMap: { [unRegisterType: string]: number } = {};

  start = () => {
    const { url, _id: id } = this.setting;
    // 注册消息接收事件
    _eventBus.addEventListener("_receive", event => {
      if (!isUrlMatched(event.url, url) || event._id !== id) {
        return;
      }
      this.receiver!(event.data);
    });

    // 注册ws连接成功事件
    _eventBus.addEventListener("_open", event => {
      if (!isUrlMatched(event.url, url) || event._id !== id) {
        return;
      }
      this.execute();
      console.log(this.setting.url, "mock已开启");
    });

    // 注册ws短线收事件
    _eventBus.addEventListener("_close", event => {
      if (!isUrlMatched(event.url, url) || event._id !== id) {
        return;
      }
      this.close();
      console.log(url, "mock已关闭");
    });
  };

  // 添加任务
  addTask = <T>(task: IWSTask<T>) => {
    const { sendType, unRegisterType } = task;
    task.isExpire = true; // 添加任务默认过期
    this.IWSTaskList.push(task);
    const index = this.IWSTaskList.length - 1;
    this.sendTypeMap[sendType] = index;
    unRegisterType && (this.unRegisterTypeMap[unRegisterType] = index);
  };

  // 清空
  close = () => {
    this.timeLineTask = [];
    this.IWSTaskList.forEach(task => {
      task.isExpire = true;
    });
    clearInterval(this.timer);
  };

  // 手动发送单条数据
  sendMsg = (type: string, data: any) => {
    const validData = procSentData(
      JSON.stringify({
        type,
        timestamp: new Date(),
        data
      })
    );

    _eventBus.dispatchEvent({
      type: "_message",
      url: this.url,
      messageEventDict: {
        data: validData.dataToBeSent
      }
    });
  };

  // 在时间轴上添加任务
  private addTimeLineTask = (task: IWSTask<any>, skep = 1) => {
    if (skep === 0 || skep === -1) {
      return;
    }
    const current = getCurrent();
    const index = current + skep;
    if (!this.timeLineTask[index]) {
      this.timeLineTask[index] = [];
    }

    this.timeLineTask[index].push(task);
  };

  // 发送数据
  private _sender = (data: any, task: IWSTask<any>) => {
    return JSON.stringify({
      type: task.messageType,
      timestamp: new Date(),
      data
    });
  };

  // 接收信息
  private _receiver = (json: string) => {
    const msg = JSON.parse(json);
    const { type, data } = msg;
    const sendTypeIndex = this.sendTypeMap[type];
    const unRegisterTypeIndex = this.unRegisterTypeMap[type];
    // 消息类型为注册
    if (sendTypeIndex !== undefined) {
      const wsTask = this.IWSTaskList[sendTypeIndex];

      wsTask.sendData = wsTask.registerFunc
        ? wsTask.registerFunc(wsTask.sendData, data)
        : data;

      // 开始添加任务
      if (wsTask.isExpire) {
        wsTask.isExpire = false;
        this.addTimeLineTask(wsTask);
      }
      return;
    }

    if (unRegisterTypeIndex === undefined) {
      return;
    }

    // 注销数据为空，任务致过期
    if (data === undefined) {
      this.removeTask(unRegisterTypeIndex);
    }

    // 消息类型为注销
    const task = this.IWSTaskList[unRegisterTypeIndex];
    task.sendData = task.unRegisterFunc
      ? task.unRegisterFunc!(task.sendData, data)
      : data;

    if (task.isExpire) {
      task.isExpire = false;
      this.addTimeLineTask(task, 0);
    }
  };

  private execute = () => {
    this.timer = window.setInterval(() => {
      const current = getCurrent();

      // 该时间点无任务
      if (!this.timeLineTask[current]) {
        return;
      }

      this.timeLineTask[current].forEach(task => {
        // 任务已过期
        if (task.isExpire) {
          return;
        }

        // 定义发送数据方法
        const onMessage = (data: any) => {
          const validData = procSentData(this.sender!(data, task));

          _eventBus.dispatchEvent({
            type: "_message",
            url: this.url,
            messageEventDict: {
              data: validData.dataToBeSent
            }
          });
        };

        // 执行任务
        task.mockFunc!(onMessage, task.sendData);

        // 向任务序列添加任务
        this.addTimeLineTask(task, task.time);
      });

      // 时间轴上删除该时间标记
      Reflect.deleteProperty(this.timeLineTask, current);
    }, 1000);
  };

  // 移除任务
  private removeTask = (index: number) => {
    const task = this.IWSTaskList[index];
    task.isExpire = true;
  };
}
