import nacl from './lib/nacl-fast-es.js'
import { h } from './lib/misc.js'
import { encode } from './lib/base64.js'
import { getImage, getName } from './avatar.js'
import { keyroute } from './routes/key.js'

const kv = new IdbKvStore('bogbook3')

export const welcome = h('div', {id: 'scroller'})

function genkey (brute) {
  let keygen = '@/'
  while (keygen.includes('/')) {
    const genkey = nacl.sign.keyPair()
    keygen = encode(genkey.publicKey) + encode(genkey.secretKey)
    if (!keygen.includes('/')) {
      if ((brute.length) && keygen.startsWith(brute.substring(0, 1))) {
        clearInterval(interval)
        stop.parentNode.replaceChild(button, stop)
      }

      const keymessage = h('div', {classList:'message'}, [
        h('p', [getImage(keygen.substring(0, 44)), ' ', getName(keygen.substring(0, 44))]),
        h('p', [h('pre', [keygen])]),
        h('button', {
          classList: 'btn btn-primary',
          onclick: function () {
            kv.set('keypair', keygen).then(done => {
              location.reload()
            })
            alert('Hold on to your keypair to maintain the same identity!\n\n' + keygen)
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

const input = h('input', {type: 'text', classList: 'input-large', style:'padding: 4px 6px; height: auto; margin-bottom: 0px;', placeholder: 'Try for a key that starts with...'})

let interval

const importKey = h('button', {
  classList: 'btn btn-success',
  onclick: function () {
    keyroute(welcome)
  }
}, ['Import'])

const stop = h('button', {
  classList: 'btn',
  onclick: function () {
    stop.parentNode.replaceChild(button, stop)
    clearInterval(interval)
  }
}, ['Stop'])

const button = h('button', {
  classList: 'btn btn-info',
  onclick: function () {
    button.parentNode.replaceChild(stop, button)
    interval = setInterval(function () {
      genkey(input.value)
    }, 75)
  }
}, ['Generate'])

const about = h('div', {classList: 'message'}, [
  h('h1', [window.location.host]),
  h('img', {style: 'width: 100%', src:'./example.png', classList: 'img-polaroid'}),
  h('p', {innerHTML:'This is an instance of Bogbook, a distributed social network of secure hashchains. When you publish messages they are signed using ed25519 public key cryptography and relayed via Deno servers.</p><p>This instance is hosted on <a href="https://deno.com/">Deno Deploy</a>.</p></p>Read the code at <a href="https://github.com/evbogue/bogbook/">Github</a> or <a href="https://git.sr.ht/~ev/bogbookv3/">SourceHut</a>.'}),
  h('button', {classList: 'btn btn-large btn-primary', onclick: function () {
    about.parentNode.removeChild(about)
    welcome.appendChild(intro)
  }}, ['Get Started!'])
])

const intro = h('div', {classList: 'message'}, [
  h('h1', ['Get started']),
  h('p', ['You have not generated an ed25519 keypair yet. To use this distributed social network you will need a keypair. Hold onto it to continue to use the same identity.']),
  h('p', ['Press generate to begin generating keypairs. When you see a keypair you want, press stop and select that keypair.']),
  importKey,
  button,
  input
])

welcome.appendChild(about)


