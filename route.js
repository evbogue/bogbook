import { getImage, getName } from './avatar.js'

export function route () {

  const screen = h('div', {id: 'screen'})

  document.body.appendChild(screen)

  const src = window.location.hash.substring(1)

  const scroller = h('div', {id: 'scroller'})

  screen.appendChild(scroller)

  let breadcrumbs
  if (src.length == 44) {
    breadcrumbs = h('a', {href: '#' + src},[
      getImage(src),
      ' ',
      getName(src)
    ])
  } else {
    breadcrumbs = h('span', ['> ' + src])
  }

  scroller.appendChild(h('div', {classList: 'message'}, [breadcrumbs]))

  window.onhashchange = function () {
    screen.parentNode.removeChild(screen)
    route()
  }
}
