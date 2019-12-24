/**
 * Simple event dispatching system
 * See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget#Example
 */
type Listener = Array<(event: any) => void>

export default class MyEventTarget {
  listeners: {
    [type: string]: Listener
  } = {}

  constructor() {}

  addEventListener(type: string, callback: (event: any) => void) {
    if (!Reflect.has(this.listeners, type)) {
      this.listeners[type] = []
    }
    const stack = this.listeners[type]
    stack.push(callback)
    // Return index
    return stack.length - 1
  }

  removeEventListener(type: string, callback: () => void) {
    if (!Reflect.has(this.listeners, type)) {
      return
    }
    const stack = this.listeners[type]
    for (let i = 0, l = stack.length; i < l; i++) {
      if (stack[i] === callback) {
        stack.splice(i, 1)
        return
      }
    }
  }

  dispatchEvent(event: any) {
    if (!Reflect.has(this.listeners, event.type)) {
      return true
    }
    const stack = this.listeners[event.type]
    for (let i = 0, l = stack.length; i < l; i++) {
      stack[i].call(this, event)
    }
    return !event.defaultPrevented
  }

  modifyHandler(type: string, index: number, newHandler: () => void) {
    if (!Reflect.has(this.listeners, type) || typeof index !== 'number') {
      return
    }
    const stack = this.listeners[type]
    stack[index] = newHandler
  }

  removeAllListeners() {
    this.listeners = {}
  }
}
