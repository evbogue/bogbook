export var keys

const kv = new IdbKvStore('ssboat')

kv.get('keypair', function (err, keypair) {
  if (!keypair) {
    console.log('generating')
    let keygen = '@/'
    while (keygen.includes('/')) {
      const genkey = nacl.sign.keyPair()
      keygen = nacl.util.encodeBase64(genkey.publicKey) + nacl.util.encodeBase64(genkey.secretKey)
      kv.set('keypair', keygen)
    }
    keypair = keygen
  }
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
})

