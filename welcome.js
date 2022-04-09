import { encode } from './lib/base64.js'
import { getImage, getName } from './avatar.js'

const kv = new IdbKvStore('ssboat')

export const welcome = h('div', {id: 'scroller'})

function genkey (brute) {
  let keygen = '@/'
  while (keygen.includes('/')) {
    const genkey = nacl.sign.keyPair()
    keygen = encode(genkey.publicKey) + encode(genkey.secretKey)
    if (!keygen.includes('/')) {
      console.log(brute.substring(0, 2))
      if ((brute.length == 1) && keygen.startsWith(brute.substring(0, 1))) {
        clearInterval(interval)
        stop.parentNode.replaceChild(button, stop)

      }
      else if (brute && keygen.startsWith(brute.substring(0, 2))) {
        clearInterval(interval)
        stop.parentNode.replaceChild(button, stop)
      }
      const keymessage = h('div', {classList:'message'}, [
        h('div', [getImage(keygen.substring(0, 44)), ' ', getName(keygen.substring(0, 44))]),
        h('div', [keygen]),
        h('button', {
          onclick: function () {
            kv.set('keypair', keygen).then(done => {
              location.reload()
            })
            alert('Hold onto your keypair to maintain the same identity!\n\n' + keygen)
          }
        }, ['Choose this keypair'])
      ])
      if (scroller.childNodes[1]) {
        scroller.insertBefore(keymessage, scroller.childNodes[1])
      } else {
        scroller.appendChild(keymessage)
      }
      if (scroller.childNodes.length > 25) {
        scroller.removeChild(scroller.lastChild)
      }
    } 
  }
}

const input = h('input', {placeholder: 'Try for a key that starts with...'})

let interval

const stop = h('button', {
  onclick: function () {
    stop.parentNode.replaceChild(button, stop)
    clearInterval(interval)
  }
}, ['Stop'])

const button = h('button', {
  onclick: function () {
    button.parentNode.replaceChild(stop, button)
    interval = setInterval(function () {
      genkey(input.value)
    }, 75)
  }
}, ['Generate'])

const intro = h('div', {classList: 'message'}, [
  'Hello! You have not generated an ed25519 keypair yet. To use this distributed social network you will need a keypair. Hold onto it to continue to use the same identity.',
  h('br'),
  button,
  input
  ])

welcome.appendChild(intro)


