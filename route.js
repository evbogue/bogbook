import { h } from './lib/misc.js'
import { home } from './routes/home.js'
import { query } from './routes/query.js'
import { keyroute } from './routes/key.js'

export function route () {
  const screen = h('div', {id: 'screen'})
  document.body.appendChild(screen)

  const scroller = h('div', {id: 'scroller'})
  screen.appendChild(scroller)
  
  const src = window.location.hash.substring(1)
  document.title = location.host + ' | ' + location.hash.substring(1)

  if (src === '') {
    home(scroller)
  } else if (src === 'key') {
    keyroute(scroller)
  } else {
    query(scroller, src)
  }

  window.onhashchange = function () {
    screen.parentNode.removeChild(screen)
    route()
  }
}
