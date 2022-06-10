import nacl from './lib/nacl-fast-es.js'
import { path } from './path.js'
import { decode, encode } from './lib/base64.js'
import { ensureFileSync } from 'https://deno.land/std@0.143.0/fs/mod.ts'

export const keys = function () {
  const keypath = path.root() + 'keypair'
  ensureFileSync(keypath)

  let keypair = Deno.readTextFileSync(keypath)

  if (!keypair) {
    console.log('generating')
    let keygen = '@/'
    while (keygen.includes('/')) {
      const genkey = nacl.sign.keyPair()
      keygen = encode(genkey.publicKey) + encode(genkey.secretKey)
    }
    keypair = keygen
    Deno.writeTextFileSync(keypath, keypair)
  }

  return {
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
}()
