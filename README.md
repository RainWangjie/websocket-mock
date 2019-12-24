# wsmock

-  覆盖 Websocket 类，提供 send、close 方法；
- 按时间序列向外部推送 mock 数据；
- 添加 mock 任务，addTask；
- 管理时间序列；
- 根据订阅内容，动态调整 mock 数据的产出；

## 调用方式

默认提供一套交通项目使用 ws 数据帧 sender、receiver 处理函数

## 示例

```js
import wsm, { WSTask } from 'ws-mock'

// 新建实例
const mockWS = new wsm({
  url: `ws://${document.location.host}/api/op/ws`,
})

if (process.env.REACT_APP_MOCK === 'true') {
  mockWS.start()
}
```

## 数据结构定义

```js
// mockWS 实例配置项
type Setting = {
  url: string; // mock-ws链接地址
  _id?: number;
  sender?: (data: any, task: WSTask<any>) => any; // 组装发送msg统一格式函数
  receiver?: (data: any) => void; // 接收msg后，处理函数
};

// WSTask
interface WSTask<T> {
  time?: number; // 执行间隔，不传值仅触发一次task
  sendType: string; // 发送信息类型
  messageType: string; // 消息类型
  unRegisterType?: string; // 取消订阅
  sendData?: T; // 发送数据结构，输出的mockData（可能）依赖于sendData
  mockFunc?(onmessage: Function, sendData?: T): void;// T为func返回数据类型
  unRegisterFunc?(oldData?: T, newData?: T): T;// 取消订阅：修改sendData方法
  registerFunc?(oldData?: T, newData?: T): T;// 订阅：修改sendData方法
  isExpire?: boolean; // 任务是否到期
}

// 事件队列
private timeLineTask: {
    [time: number]: WSTask<any>[];
} = {};

// task存储
private wsTaskList: WSTask<any>[] = [];
```

## TODOLIST

- [ ] 时间管理与事件触发用 worker 管理
