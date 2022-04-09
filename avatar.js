import { decode } from './lib/base64.js'

export function getImage (id) {
  let img = vb(decode(id), 256)
  img.classList = 'avatar'  
  return img
}

export function getName (id) {
  return id.substring(0, 10) + '...'
}
