import wsm from 'websocket-mock'

const url = `ws://${document.location.host}/hzv2/websocket/traffic/service/ws`

const mockWS = new wsm({
  url,
})

// 注册任务
mockWS.addTask({
  time: 3,
  sendType: 'send1',
  messageType: 'message1',
  unRegisterType: 'un-register1',
  mockFunc: onMessage => {
    onMessage('A010B020C030D020E030')
  },
})

mockWS.addTask({
  sendType: 'send2',
  messageType: 'message2',
  mockFunc: onMessage => {
    onMessage('hello')
  },
})
mockWS.start()

// 初始化ws
const ws: WebSocket = new WebSocket(url)

ws.onopen = () => {
  console.log('open success')
  ws.send(
    JSON.stringify({
      type: 'send1',
    })
  )
  ws.send(
    JSON.stringify({
      type: 'send2',
    })
  )
  console.log('send success')

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: 'un-register1',
      })
    )
  }, 10 * 1000)
}

ws.onmessage = (e: MessageEvent) => {
  const data = JSON.parse(e.data)
  console.log('message', data)
}

ws.onclose = () => {
  console.log('WebSocketClosed!')
}

ws.onerror = () => {
  console.log('WebSocketError!')
}
