import nacl from './lib/nacl-fast-es.js'
import { keys } from './keys.js'
import { decode, encode } from './lib/base64.js'
import { find } from './inpfserver.js'

export async function open (msg) {
  const obj = {}
  obj.timestamp = new Number(msg.substring(0, 13))
  obj.author = msg.substring(13, 57)
  obj.hash = msg.substring(57, 101)
  obj.previous = msg.substring(101, 145)
  obj.data = msg.substring(145, 189)
  //should be at render obj.text = await find(obj.data)
  obj.raw = msg

  console.log(obj)

  const opened = new TextDecoder().decode(nacl.sign.open(decode(msg.substring(189)), decode(obj.author)))

  if (opened === msg.substring(0, 189)) {
    return obj
  }
}

