import { keys } from './browserkeys.js'
import { navbar } from './navbar.js'
import { route } from './route.js'
import { welcome } from './welcome.js'
import { connect } from './replicate.js'
import { h } from './lib/misc.js' 

if (!window.location.hash) { window.location = '#' }

function start () {
  if (keys === 'welcome') {
    document.body.appendChild(h('div', {classList: 'container'}, [welcome]))
    document.title = location.host + ' | Welcome'
  } else if (keys) {
    const proto = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    const server = [proto + window.location.host + '/ws']
    document.addEventListener('click', () => {
      Notification.requestPermission()
    })

    connect(server)
    route()
    navbar() 
  } else {
    setTimeout(function () { start() }, 1500)
  }
}

start()

