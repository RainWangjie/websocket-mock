import { procSentData, isValidUrl, isUrlMatched } from './utils'
import _EventTarget from './event-target'
import _eventBus from './event-bus'
import WsMock from '.'
import { mockSocketUrls, mockSocketSettings } from './mock-store'

const _WebSocket = (window as any)['WebSocket']
const onEvents = ['close', 'error', 'message', 'open']

// Override native
class WebSocket extends _EventTarget {
  // 状态定义
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  // @ts-ignore
  onclose: CloseEvent = null
  // @ts-ignore
  onerror: Event = null
  // @ts-ignore
  onmessage: MessageEvent = null
  // @ts-ignore
  onopen: Event = null

  constructor(url: string, protocols: string | string[]) {
    super()
    if (arguments.length < 1) {
      throw TypeError(
        `Failed to construct 'WebSocket': 1 argument required, but only 0 present.`
      )
    }

    // 不在mockSocketUrls的url，仍返回window.WebSocket
    for (let i = 0; i < mockSocketUrls.length; i++) {
      if (isUrlMatched(mockSocketUrls[i][0], url)) {
        console.log('开始链接')

        const urlValidationResult = isValidUrl(url)
        if (typeof urlValidationResult === 'string') {
          throw new DOMException(
            `Failed to construct 'WebSocket': ${urlValidationResult}`
          )
        }

        // 初始化定义
        this._observeProps()
        this._url = url
        this._index = i

        this._closeEventDict = {
          code: 1000,
          reason: `Connection of mock WebSocket with url '${this._url}' is closed because you are so ugly.`,
          wasClean: true,
        }

        // 绑定message event
        this._attachEvents()

        // 开始连接
        setTimeout(() => {
          this._readyState = WebSocket.OPEN
          const settings = mockSocketSettings[this._index]

          // 通知对应wsmock ws已close
          settings.map(setting => {
            _eventBus.dispatchEvent({
              type: '_open',
              url: setting.url,
              _id: setting._id,
            })
          })
        }, WsMock.configs.CONNECTING_TIME)
        return
      }
    }

    // store内不存在mock的ws，返回browner的websocket实现
    console.log(
      `%cMock setting for url '${url}' not found, native WebSocket will be invoked.`,
      'color: red;'
    )

    const WS = new _WebSocket(url, protocols)

    // @ts-ignore
    return WS
  }

  private _url: string = ''
  private _index: number = -1
  private _readyState: number = WebSocket.CONNECTING
  private _bufferedAmount: number = 0
  private _closeEventDict: {
    code: number
    reason: string
    wasClean: boolean
  }

  send(data: any) {
    if (arguments.length < 1) {
      throw new TypeError(
        `Failed to execute 'send' on 'WebSocket': 1 argument required, but only 0 present.`
      )
    }
    if (this._readyState === WebSocket.CONNECTING) {
      throw new DOMException(
        `Failed to execute 'send' on 'WebSocket': Still in CONNECTING state.`,
        'InvalidStateError'
      )
    } else if (this._readyState !== WebSocket.OPEN) {
      console.log('WebSocket is already in CLOSING or CLOSED state.')
      return
    }

    const validData = procSentData(data)
    const dataToBeSent = validData.dataToBeSent
    const settings = mockSocketSettings[this._index]
    const waitingTime = (this._bufferedAmount / WsMock.configs.SEND_RATE) * 1000
    setTimeout(() => {
      settings.map(setting => {
        const receiver = setting.receiver
        receiver && receiver.call(setting, dataToBeSent)
        _eventBus.dispatchEvent({
          type: '_receive',
          url: setting.url,
          _id: setting._id,
          data,
        })
      })
    }, waitingTime)
  }

  close(code = 1000, reason: string) {
    code = Number(code)
    code = isNaN(code) || code < 0 ? 0 : code > 65535 ? 65535 : code
    // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
    if (code !== 1000 && (code < 3000 || code > 4999)) {
      throw new DOMException(
        `Failed to execute 'close' on 'WebSocket': 
        The code must be either 1000, or between 3000 and 4999. ${code} is neither.`,
        'InvalidAccessError'
      )
    }

    this._readyState = WebSocket.CLOSING
    setTimeout(() => {
      this._closeEventDict.code = code
      reason && (this._closeEventDict.reason = reason)
      this._readyState = WebSocket.CLOSED
      this.removeAllListeners()

      const settings = mockSocketSettings[this._index]

      // 通知对应wsmock ws已close
      settings.map(setting => {
        _eventBus.dispatchEvent({
          type: '_close',
          url: setting.url,
          _id: setting._id,
        })
      })
    }, WsMock.configs.CLOSING_TIME)
  }

  _attachEvents() {
    _eventBus.addEventListener(
      '_message',
      this._dispatchMessageEvent.bind(this)
    )
  }

  _dispatchMessageEvent(event: any) {
    if (!isUrlMatched(event.url, this._url)) {
      return
    }
    this.dispatchEvent(
      this._defineEventProps(
        new MessageEvent('message', {
          data: null,
          origin: this._url,
          lastEventId: '',
          source: null,
          ports: [],
          ...event.messageEventDict,
        })
      )
    )
  }

  _observeProps() {
    this._observeBinaryType()
    this._observeBufferedAmount()
    this._observeExtensions()
    this._observeProtocol()
    this._observeOnEvents()
    this._observeReadyState()
    this._observeUrl()
  }

  _observeBinaryType() {
    const validEnum = ['blob', 'arraybuffer']
    let binaryTypeValue = 'blob'
    Object.defineProperty(this, 'binaryType', {
      configurable: true,
      enumerable: true,
      get() {
        return binaryTypeValue
      },
      set(val) {
        if (validEnum.indexOf(val) > -1) {
          binaryTypeValue = val
        } else {
          console.warn(
            `The provided value '${val}' is not a valid enum value of type BinaryType.`
          )
        }
      },
    })
  }

  _observeBufferedAmount() {
    this._observeReadOnlyProps('bufferedAmount', 0)
  }

  _observeExtensions() {
    this._observeReadOnlyProps('extensions', '')
  }

  _observeProtocol() {
    this._observeReadOnlyProps('protocol', '')
  }

  _observeOnEvents() {
    onEvents.map(event => {
      let eventIndex: number
      let handler: any = null
      Object.defineProperty(this, `on${event}`, {
        configurable: true,
        enumerable: true,
        get() {
          return handler
        },
        set(val) {
          if (!handler) {
            eventIndex = this.addEventListener(event, val)
          } else {
            this.modifyHandler(event, eventIndex, val)
          }
          handler = val
        },
      })
    })
  }

  _observeReadyState() {
    this._observeReadOnlyProps(
      'readyState',
      WebSocket.CONNECTING,
      (val: number) => {
        switch (val) {
          case WebSocket.OPEN:
            this.dispatchEvent(this._defineEventProps(new Event('open')))
            break
          case WebSocket.CLOSED:
            this.dispatchEvent(
              this._defineEventProps(
                new CloseEvent('close', this._closeEventDict)
              )
            )
            break
          default:
            break
        }
      }
    )
  }

  _observeUrl() {
    this._observeReadOnlyProps('url', '')
  }

  _observeReadOnlyProps(
    propName: string,
    defaultValue: number | string,
    setterCallback?: (val: any) => void
  ) {
    let propValue = defaultValue
    Object.defineProperty(this, `_${propName}`, {
      configurable: true,
      enumerable: false,
      get() {
        return propValue
      },
      set(val) {
        propValue = val
        setterCallback &&
          typeof setterCallback === 'function' &&
          setterCallback.call(this, val)
        Object.defineProperty(this, propName, {
          value: propValue,
          configurable: true,
          enumerable: true,
          writable: false,
        })
      },
    })
    // @ts-ignore
    this[`_${propName}`] = defaultValue
  }

  _defineEventProps(event: Event) {
    const props = ['srcElement', 'currentTarget', 'target']
    props.map(prop => {
      Object.defineProperty(event, prop, {
        value: this,
        configurable: true,
        enumerable: true,
      })
    })
    return event
  }
}

// @ts-ignore
WebSocket.prototype.CONNECTING = WebSocket.CONNECTING
// @ts-ignore
WebSocket.prototype.OPEN = WebSocket.OPEN
// @ts-ignore
WebSocket.prototype.CLOSING = WebSocket.CLOSING
// @ts-ignore
WebSocket.prototype.CLOSED = WebSocket.CLOSED
// @ts-ignore
WebSocket._nativeWebSocket = _WebSocket

export default WebSocket
