import { keys } from './keys.js'
import { navbar } from './navbar.js'
import { route } from './route.js'
import { connect } from './replicate.js'
import { h } from './lib/misc.js' 

if (!window.location.hash) { window.location = '#' }

function start () {
  if (keys) {
    const container = h('div', {classList: 'container'})
    document.body.appendChild(container)
    const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    const server = [proto + window.location.host + '/ws']

    document.addEventListener('click', () => {
      Notification.requestPermission()
    })

    connect(server)
    container.appendChild(navbar())
    route(container)
  } else {
    setTimeout(function () { start() }, 5000)
  }
}

start()

