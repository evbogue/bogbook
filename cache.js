import { find } from './inpfs.js' 

const cache = new Map()

export const cache = function (hash) {
  return {
    get: function (query) {
      let get = cache.get(query)
      if (get) {
        return get
      } else {
        find(hash).then(image => {
          cache.set(query, image)
          return image
        })
      }
    }
  }
}()
