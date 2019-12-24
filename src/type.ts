export interface IWSTask<T> {
  time?: number // 执行间隔,0/-1仅发送一次
  sendType: string // 发送/订阅信息类型
  messageType: string // 消息类型
  unRegisterType?: string // 取消订阅
  sendData?: T // 发送数据结构
  isExpire?: boolean // 任务是否到期
  mockFunc?(onmessage: (data: any) => void, sendData?: T): void // T为func返回数据类型
  unRegisterFunc?(oldData?: T, newData?: T): T // 取消订阅：修改sendData方法
  registerFunc?(oldData?: T, newData?: T): T // 订阅：修改sendData方法
}

export interface IWSMockSetting {
  url: string
  _id?: number
  sender?: (data: any, task: IWSTask<any>) => any
  receiver?: (data: any) => void
}

export interface IWSMockConfig {
  CONNECTING_TIME: number
  CLOSING_TIME: number
  SEND_RATE: number // send rate, bytes per second
}
