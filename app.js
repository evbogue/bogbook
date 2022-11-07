import { keys } from './keys.js'
import { navbar } from './navbar.js'
import { route } from './route.js'
import { connect } from './replicate.js'
import { h } from './lib/misc.js' 
import { welcome } from './welcome.js'

if (!window.location.hash) { window.location = '#' }

function start () {
  const container = h('div', {classList: 'container'})
  document.body.appendChild(container)
  if (keys === 'welcome') {
    container.appendChild(welcome)
  } else if (keys) {
    const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    const server = [proto + window.location.host + '/ws']

    connect(server)
    container.appendChild(navbar())
    route(container)
    
  } else {
    setTimeout(function () { start() }, 5000)
  }
}

start()

