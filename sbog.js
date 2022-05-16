import nacl from './lib/nacl-fast-es.js'
import { keys } from './browserkeys.js'
import { decode, encode } from './lib/base64.js'
import { logs } from './browserlog.js'
import { make, find } from './inpfs.js'

export async function publish (data) {

  const datahash = await make(data)

  const timestamp = Date.now()

  let msg = timestamp + keys.pubkey() + datahash

  const hash = encode(sha256(new TextEncoder().encode(msg)))

  let previous = await logs.getLatest(keys.pubkey())

  if (!previous) {
    previous = hash
  }

  msg = timestamp + keys.pubkey() + hash + previous + datahash
  
  const sig = encode(nacl.sign(new TextEncoder().encode(msg), decode(keys.privkey())))

  msg = msg + sig
  logs.add(msg)
  console.log(msg)
  return msg
}

export async function open (msg) {
  const obj = {}
  obj.timestamp = new Number(msg.substring(0, 13))
  obj.author = msg.substring(13, 57)
  obj.hash = msg.substring(57, 101)
  obj.previous = msg.substring(101, 145)
  obj.data = msg.substring(145, 189)
  obj.text = await find(obj.data)
  obj.raw = msg

  console.log(obj)

  const opened = new TextDecoder().decode(nacl.sign.open(decode(msg.substring(189)), decode(obj.author)))

  if (opened === msg.substring(0, 189)) {
    return obj
  }
}

