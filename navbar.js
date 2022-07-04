import { h } from './lib/misc.js'
import { keys } from './browserkeys.js'
import { getBoth } from './avatar.js'

export function navbar (screen) {
  const navbar = h('div', {classList: 'navbar navbar-fixed-top'})
  const internal = h('div', {classList: 'navbar-inner'}, [
    h('ul', {classList: 'nav'}, [

      h('li', [getBoth(keys.pubkey())]),
      h('li', [h('a', {href: '#'}, ['Home'])]),
      h('li', [h('a', {href: '#key'}, ['Key'])])
    ])
  ])
  navbar.appendChild(internal)

  return navbar
}
