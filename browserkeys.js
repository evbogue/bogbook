import nacl from './lib/nacl-fast-es.js'
import { decode, encode } from './lib/base64.js'

export var keys

const kv = new IdbKvStore('merklebog')

kv.get('keypair', function (err, keypair) {
  if (!keypair) { keys = 'welcome'}
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
      }
    }
  }
})

