import nacl from './lib/nacl-fast-es.js'
import { keys } from './keys.js'
import { decode, encode } from './lib/base64.js'

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
    return message
  }
}

