import { keys } from './browserkeys.js'
import { getImage, getName } from './avatar.js'

export function navbar (screen) {
  const navbar = h('div', {id: 'navbar'})
  document.body.appendChild(navbar)
  const internal = h('div', {classList: 'internal'}, [
    h('a', {href: '#' + keys.pubkey()}, [
      getImage(keys.pubkey()), 
      ' ',
      getName(keys.pubkey())
    ]),
    ' ',
    h('a', {href: '#'}, ['Home'])
  ])
  navbar.appendChild(internal)
}
