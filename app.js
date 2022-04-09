import { keys } from './browserkeys.js'
import { navbar } from './navbar.js'
import { route } from './route.js'
import { welcome } from './welcome.js'

if (!window.location.hash) { window.location = '#' }

function start () {
  if (keys === 'welcome') {
    document.body.appendChild(welcome) 
  } else if (keys) {
    //welcome.parentNode.removeChild(welcome)
    route()
    navbar() 
  } else {
    console.log(keys)
    //document.body.appendChild(welcome)
    setTimeout(function () { start() }, 1500)
  }
}

start()

