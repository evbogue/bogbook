import { h } from './lib/misc.js'
import { home } from './routes/home.js'
import { query } from './routes/query.js'
import { keyroute } from './routes/key.js'
import { keys } from './keys.js'
import { plainTextName } from './avatar.js'

export function route (container) {
  const screen = h('div', {id: 'screen'})
  const scroller = h('div', {id: 'scroller'})

  container.appendChild(screen)
  screen.appendChild(scroller)
  
  const src = window.location.hash.substring(1)

  if (src.length == 43) {
    window.location.hash = src + '='
  }

  const id = location.hash.substring(1)
  if (id.length == 44) {
    document.title = location.host + ' | ' + plainTextName(id) + ' | ' + id 
  }  

  if (location.hash.substring(1) === '') {
    document.title = location.host + ' | Home'
  }

  if (src === '') {
    home(scroller)
  } else if (src === 'key') {
    keyroute(scroller)
  } else {
    query(scroller, src)
  }

  window.onhashchange = function () {
    screen.parentNode.removeChild(screen)
    route(container)
  }
}
