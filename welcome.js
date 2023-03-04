import { cachekv } from './cachekv.js'
import nacl from './lib/nacl-fast-es.js'
import { h, human, vb } from './lib/misc.js'
import { encode, decode } from './lib/base64.js'
import { make, find } from './blob.js'
import { publish } from './sbog.js'

export const welcome = h('div', {id: 'scroller'})

let keygen = '@/'
let imagesrc
let name
let photoUploaded = false

const keydiv = h('pre', {id: 'keydiv'}, ['/'])

function genkey (brute) {
  keygen = '@/'
  while (keygen.includes('/') || !keygen.startsWith(brute.substring(0, 1))) {
    const genkey = nacl.sign.keyPair()
    keygen = encode(genkey.publicKey) + encode(genkey.secretKey)
    const keydiv = document.getElementById('keydiv')
    keydiv.textContent = keygen
  }
}

function photoAdder (imgDiv) {
  const uploadButton = h('button', {title: 'New photo', classList: 'btn', onclick: function () {
    input.click()
  }}, ['📸  '])

  const buttonsDiv = h('span', [
    uploadButton
  ])

  const input = h('input', { type: 'file', style: 'display: none;', onchange: function (e) {
    const file = e.srcElement.files[0]
    const img = h('img', {classList: 'thumb'})
    const reader = new FileReader()
    reader.onloadend = function () {
      img.src = reader.result
      make(img.src).then(hash => {
        const profilePhoto = document.getElementById('profilePhoto')
        profilePhoto.src = reader.result
        imagesrc = reader.result
        photoUploaded = true
      })
    }

    reader.readAsDataURL(file)
  }})

  return buttonsDiv
}


function renderMsg () {
  const img = vb(decode(keygen.substring(0, 44)))
  img.classList = 'avatar'
  img.id = 'profilePhoto'
  const div = h('div', {classList: 'message'}, [
    h('span', {classList: 'right'}, [
      h('code', [keygen.substring(0, 7)]),
      ' ',
      h('a', {href: ''}, [human(new Date(Date.now()))]) 
    ]),
    img,
    ' ',
    h('a', {href: ''}, [name]),
    h('div', [h('p', ['Hello world!'])])
  ])
  return div
}

function photoDiv () {
  const photo = h('div', {classList: 'message'}, [
    h('h1', ['One last step!']),
    h('p', ['Right now messages you publish will look this way:']),
    renderMsg(),
    h('p', ['Do you want to upload a profile photo?']),
    photoAdder(),
    h('p', ['Are you ready?']),
    h('button', { onclick: function () {
      if (photoUploaded) {
        make(profilePhoto.src).then(hash => {
          publish('image:' + hash + keygen.substring(0, 44), keygen).then(msg => {
            alert('Don\'t forget to save your keypair somewhere special. It is: ' + keygen)
            location.reload()
          })
        })
      } else {
        alert('Don\'t forget to save your keypair somewhere special. It is: ' + keygen)
        location.reload()
      }
    }},['Let\'s go!'])
  ])
  return photo
}

const nameInput = h('input', {placeholder: 'Choose a name'})

const textarea = h('textarea', {placeholder: 'Import a keypair'})

const importer = h('div', [
  textarea,
  h('button', {onclick: function () {
    if (textarea.value && (textarea.value.length === 132)) {
      cachekv.put('keypair', textarea.value).then(function () {
        location.hash = ''
        location.reload()
      })
    } if (textarea.value.length != 132) {
      alert('Invalid Keypair')
    }
  }}, ['Import'])
])

const intro = h('div', {classList: 'message'}, [
  h('h1', ['Get started']),
  h('p', ['On Bogbook you are identified using a name and an ed25519 public key. Type a name below to continue:']),
  h('br'),
  nameInput,
  h('button', {onclick: function () {
    if (nameInput.value) {
      name = nameInput.value
      const got = document.getElementById('hello')
      if (got) {
        got.parentNode.removeChild(got)
      }
      intro.appendChild(h('p', {id: 'hello'} , ['Hi ' + name + '! Here\'s a keypair that starts with the first letter of your name.']))
      hello.appendChild(keydiv)
      this.textContent = 'Try again'
      genkey(nameInput.value)
      hello.appendChild(h('button', { onclick: function () {
        make(nameInput.value).then(made => {
          publish('name:' + made + keygen.substring(0, 44), keygen).then(msg => {
            cachekv.put('keypair', keydiv.textContent)
            intro.parentNode.removeChild(intro)
            welcome.appendChild(photoDiv())
          })
        })
      }},['Use this key']))
    } 
  }}, ['Choose']),
  h('button', {
    onclick: function () {
      intro.appendChild(importer)
    }
  }, ['Import existing keypair'])
])

const about = h('div', {classList: 'message'}, [
  h('h1', [window.location.host]),
  h('img', {style: 'width: 100%', src:'./example.png'}),
  h('p', {innerHTML:'This is an instance of Bogbook, a distributed social network of secure hashchains. When you publish messages they are signed using ed25519 public key cryptography and relayed via Deno servers.</p><p>Read the code at <a href="https://github.com/evbogue/bogbook/">Github</a> or <a href="https://git.sr.ht/~ev/bogbookv3/">SourceHut</a>.'}),
  h('button', {classList: 'btn btn-large btn-primary', onclick: function () {
    about.parentNode.removeChild(about)
    welcome.appendChild(intro)
  }}, ['Get Started!'])
])

welcome.appendChild(about)
