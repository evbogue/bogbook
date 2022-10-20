import nacl from './lib/nacl-fast-es.js'
import { decode, encode } from './lib/base64.js'
import { cachekv } from './cachekv.js'

export let keys

cachekv.get('keypair').then(keypair => {
  if (!keypair) {
    let keygen = '@/'
    while (keygen.includes('/')) {
      const genkey = nacl.sign.keyPair()
      keygen = encode(genkey.publicKey) + encode(genkey.secretKey)
      cachekv.put('keypair', keygen)
    }
  } 
  if (keypair) {
    keys = {
      keypair: function () {
        return keypair
      },
      pubkey: function () {
        return keypair.substring(0, 44)
      },
      privkey: function () {
        return keypair.substring(44, keys.length)
      },
      deletekey: function () {
        cachekv.rm('keypair')
      }
    }
  }
})
