import nacl from './lib/nacl-fast-es.js'
import { keys } from './browserkeys.js'
import { decode, encode } from './lib/base64.js'
import { logs } from './browserlog.js'
import { make, find } from './inpfs.js'

export async function publish (data) {

  const hash = await make(data)

  const timestamp = Date.now()

  let msg = timestamp + keys.pubkey() + hash

  const previous = await logs.getLatest(keys.pubkey())

  if (!previous) {
    msg = msg + hash
  } else {
    msg = msg + previous
  }

  const sig = nacl.sign(new TextEncoder().encode(msg), decode(keys.privkey()))

  msg = msg + encode(sig)
  logs.add(msg)
  return msg
}

export async function open (msg) {
  const obj = {}
  obj.timestamp = new Number(msg.substring(0, 13))
  obj.author = msg.substring(13, 57)
  obj.hash = msg.substring(57, 101)
  obj.previous = msg.substring(101, 145)
  obj.text = await find(obj.hash)
  obj.raw = msg

  const opened = new TextDecoder().decode(nacl.sign.open(decode(msg.substring(145)), decode(obj.author)))

  if (opened === msg.substring(0, 145)) {
    console.log(obj)
    return obj
  }
}

