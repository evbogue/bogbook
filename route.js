import { h } from './lib/misc.js'
import { home } from './routes/home.js'
import { pubhash } from './routes/pubhash.js'

export function route () {
  const screen = h('div', {id: 'screen'})
  document.body.appendChild(screen)

  const scroller = h('div', {id: 'scroller'})
  screen.appendChild(scroller)
  
  const src = window.location.hash.substring(1)

  if (src === '') {
    home(scroller)
  } if (src.length == 44) {
    pubhash(scroller, src)
  }

  window.onhashchange = function () {
    screen.parentNode.removeChild(screen)
    route()
  }
}
