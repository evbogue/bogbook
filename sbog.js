import nacl from './lib/nacl-fast-es.js'
import { keys } from './browserkeys.js'
import { decode, encode } from './lib/base64.js'
import { logs } from './browserlog.js'
import { make, find } from './inpfs.js'

export async function publish (data) {

  const datahash = await make(data)

  const timestamp = Date.now()

  const msg = timestamp + keys.pubkey() + datahash

  const hash = encode(sha256(new TextEncoder().encode(msg)))

  let previous = await logs.getLatest(keys.pubkey()).hash
  console.log('PREVIOUS:' + previous)

  if (!previous) {
    previous = hash
  }

  const next = msg + previous + hash
  
  const sig = encode(nacl.sign(new TextEncoder().encode(next), decode(keys.privkey())))

  const done = keys.pubkey() + sig
  logs.add(done)
  return done
}

export async function open (msg) {
  const opened = new TextDecoder().decode(nacl.sign.open(decode(msg.substring(44)), decode(msg.substring(0, 44))))

  const obj = {
    timestamp: parseInt(opened.substring(0, 13)),
    author: opened.substring(13, 57),
    hash : opened.substring(145),
    previous: opened.substring(101, 145),
    data: opened.substring(57, 101),
    raw: msg
  }

  //should be at render? obj.text = await find(obj.data)
  obj.text = await find(obj.data)

  return obj
}

