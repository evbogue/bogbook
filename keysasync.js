import { cachekv } from './cachekv.js'
import nacl from './lib/nacl-fast-es.js'
import { encode } from './lib/base64.js'

export const keys = {}

keys.keypair = async () => {
  const keypair = await cachekv.get('keypair')
  if (!keypair) {
    const genkey = nacl.sign.keyPair()
    const keygen = encode(genkey.publicKey) + encode(genkey.secretKey)
    cachekv.put('keypair', keygen)
    location.reload()
  } else {
    return keypair
  }
}

keys.pubkey = async () => {
  const keypair = await cachekv.get('keypair') 

  return keypair.substring(0, 44)
}
