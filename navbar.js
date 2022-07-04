import { h } from './lib/misc.js'
import { keys } from './browserkeys.js'
import { getBoth } from './avatar.js'

export function navbar (screen) {

  const src = window.location.hash.substring(1)

  const profile = h('li', [getBoth(keys.pubkey())])
  const homepage = h('li', [h('a', {href: '#'}, ['Home'])])
  const keypage = h('li', [h('a', {href: '#key'}, ['Key'])])

  if (src === '') {
    homepage.classList = 'active'
  } 

  if (src === 'key') {
    keypage.classList = 'active'
  }

  if (src === keys.pubkey()) {
    profile.classList = 'active'
  } 

  const navbar = h('div', {classList: 'navbar navbar-fixed-top'})
  const internal = h('div', {classList: 'navbar-inner'}, [
    h('ul', {classList: 'nav'}, [
      profile,
      homepage,
      keypage
    ])
  ])

  navbar.appendChild(internal)

  return navbar
}
