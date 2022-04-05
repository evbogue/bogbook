import { keys } from './browserkeys.js'

function start () {
  if (keys) {
    document.body.appendChild(h('div', [keys.pubkey()]))
  } else {
    setTimeout(function () {
      start()
    }, 150)
  }
}

start()

