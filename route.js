import { h } from './lib/misc.js'
import { home } from './routes/home.js'
import { query } from './routes/query.js'
import { keyroute } from './routes/key.js'
import { navbar } from './navbar.js'

export function route () {
  const screen = h('div', {id: 'screen', classList: 'container'})
  document.body.appendChild(screen)
  screen.appendChild(navbar())

  const scroller = h('div', {id: 'scroller'})
  screen.appendChild(scroller)
  
  const src = window.location.hash.substring(1)
  document.title = location.host + ' | ' + location.hash.substring(1)

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
    screen.appendChild(navbar())
    route()
  }
}
