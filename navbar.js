import { keys } from './browserkeys.js'

export function navbar (screen) {
  const navbar = h('div', {id: 'navbar'})
  document.body.appendChild(navbar)
  const internal = h('div', {classList: 'internal'}, [
    h('a', {href: '#' + keys.pubkey()}, [keys.pubkey().substring(0, 7)]),
    ' ',
    h('a', {href: '#'}, ['Home'])
  ])
  navbar.appendChild(internal)
}
