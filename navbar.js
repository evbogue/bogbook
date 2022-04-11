import { h } from './lib/misc.js'
import { keys } from './browserkeys.js'
import { getBoth } from './avatar.js'

export function navbar (screen) {
  const navbar = h('div', {id: 'navbar'})
  document.body.appendChild(navbar)
  const internal = h('div', {classList: 'internal'}, [
    getBoth(keys.pubkey()),
    ' ',
    h('a', {href: '#'}, ['Home'])
  ])
  navbar.appendChild(internal)
}
