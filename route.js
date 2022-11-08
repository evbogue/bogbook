import { h } from './lib/misc.js'
import { home } from './routes/home.js'
import { query } from './routes/query.js'
import { keyroute } from './routes/key.js'
import { keys } from './keys.js'

export function route (container) {
  const screen = h('div', {id: 'screen', classList: 'row'})
  container.appendChild(screen)

  const scroller = h('div', {id: 'scroller', classList: 'span8 offset2'})
  screen.appendChild(scroller)
  
  let src = window.location.hash.substring(1)

  if (src.length == 43) {
    window.location.hash = src + '='
  }

  document.title = location.host + ' | ' + location.hash.substring(1)

  if (location.hash.substring(1) === '') {
    document.title = location.host + ' | Home'
  }

  const navprofile = document.getElementById('navprofile')
  const navhome = document.getElementById('navhome')
  const navkey = document.getElementById('navkey')

  if (src === '') {
    navhome.classList = 'active'
    navkey.classList = ''
    navprofile.classList = ''
    home(scroller)
  } else if (src === 'key') {
    navkey.classList = 'active'
    navhome.classList = ''
    navprofile.classList = ''
    keyroute(scroller)
  } else if (src === keys.pubkey()) {
    navprofile.classList = 'active'
    navkey.classList = ''
    navhome.classList = ''
    query(scroller, src)
  } else {
    query(scroller, src)
  }

  window.onhashchange = function () {
    
    screen.parentNode.removeChild(screen)
    route(container)
  }
}
