import { h, vb } from './lib/misc.js'
import { decode } from './lib/base64.js'

export function getImage (id) {
  let img = vb(decode(id), 256)
  img.classList = 'avatar'  
  return img
}

export function getName (id) {
  return id.substring(0, 10) + '...'
}

export function getBoth (id) {
  const both = h('a', {href: '#' + id}, [
    getImage(id),
    ' ',
    getName(id)
  ])
  return both
}
