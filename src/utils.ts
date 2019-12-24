export const procSentData = (data: any) => {
  let dataSize = 0
  let dataToBeSent = data
  // Data type confirm
  // String.
  if (typeof data === 'string') {
    dataSize += data.length
  } else if (data instanceof ArrayBuffer) {
    // ArrayBuffer. Use arrayBuffer.byteLength

    dataSize += data.byteLength
  } else if (data instanceof Blob) {
    // Blob. Use blob.size
    dataSize += data.size
  } else if (data.byteLength) {
    // ArrayBufferView/TypedArray. Judge if has byteLength and BYTES_PER_ELEMENT
    dataSize += data.byteLength * (data.BYTES_PER_ELEMENT || 1)
  } else {
    // Other type. ('' + data).length
    dataToBeSent = '' + data
    dataSize += dataToBeSent.length
  }
  return {
    dataToBeSent,
    dataSize,
  }
}

export const isValidUrl = (url: string) => {
  // If URL API does not exist, just check if url was a string type and not empty.
  // Other polyfill modules would make this module size too huge and url validation is not quite necessary.
  if (typeof URL !== 'function') {
    return typeof url === 'string' && url !== ''
  }
  let _url = {}
  try {
    _url = new URL(url)
  } catch (error) {
    return `The URL '${url}' is invalid.`
  }
  // @ts-ignore
  const _protocol = _url.protocol
  if (_protocol !== 'ws:' && _protocol !== 'wss:') {
    return `The URL's scheme must be either 'ws' or 'wss'. '${_protocol.slice(
      0,
      -1
    )}' is not allowed.`
  }
  return true
}

export const isUrlMatched = (url1: string | RegExp, url2: string | RegExp) => {
  if (typeof url1 === typeof url2 && typeof url1 === 'string') {
    // If both string.
    return url1 === url2
  }

  if (url1 instanceof RegExp && url2 instanceof RegExp) {
    return url1.toString() === url2.toString()
  }

  let str = ''
  const reg =
    url1 instanceof RegExp
      ? ((str = url2 as string), url1)
      : url2 instanceof RegExp
      ? ((str = url1), url2)
      : undefined

  if (reg === undefined) {
    return false
  }

  return reg.test(str)
}

export const getCurrent = () => ~~(new Date().getTime() / 1000)
