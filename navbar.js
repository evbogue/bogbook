import { h } from './lib/misc.js'
import { keys } from './browserkeys.js'
import { getBoth } from './avatar.js'

export function navbar (screen) {
  const navbar = h('div', {id: 'navbar'})
  document.body.appendChild(navbar)
  const internal = h('div', {classList: 'internal'}, [
    getBoth(keys.pubkey()),
    ' ',
    h('code', [keys.pubkey().substring(0, 7)]),
    ' ',
    h('a', {href: '#'}, ['Home']),
    ' ',
    h('a', {href: '#key'}, ['Key']),
    h('span', {classList: 'right'}, [
      h('a', {href: 'https://github.com/evbogue/bogbook'}, ['github']),
      h('code', [' or ']),
      h('a', {href: 'https://git.sr.ht/~ev/bogbookv3'}, ['sr.ht'])
    ])
  ])
  navbar.appendChild(internal)
}
