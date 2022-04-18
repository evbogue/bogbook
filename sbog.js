import nacl from './lib/nacl-fast-es.js'
import { keys } from './browserkeys.js'
import { decode, encode } from './lib/base64.js'
import { logs } from './browserlog.js'

export async function publish (obj) {
  obj.author = keys.pubkey()
  obj.timestamp = Date.now()

  const tosign = new TextEncoder().encode(JSON.stringify(obj))
  const sig = nacl.sign(tosign, decode(keys.privkey()))
  const hash = new Uint8Array(await crypto.subtle.digest(
    "SHA-256",
    sig
    //new TextEncoder().encode(sig)
  ))
  let authorfeed = logs.getFeed(obj.author)
  let previous
  if (!authorfeed) {
    previous = encode(hash)
  } else { previous = authorfeed[0].substring(0, 44)}
  const msg = encode(hash) + obj.author + previous + encode(sig) 
  logs.addMsg(msg)
  return msg
}

export async function open (msg) {
  const author = msg.substring(44, 88)
  const sig = msg.substring(132)
  const hash = new Uint8Array(await crypto.subtle.digest(
    "SHA-256",
    decode(sig)
  ))
   
  if (encode(hash) === msg.substring(0, 44)) {
    const opened = nacl.sign.open(decode(sig), decode(author))
    const message = JSON.parse(new TextDecoder().decode(opened))
    message.raw = msg
    console.log(message)
    return message
  }
}
