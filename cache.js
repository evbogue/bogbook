import { find } from './blob.js' 

const cached = []

export const cache = function (hash) {
  return {
    get: function (hash) {
      if (cached[hash]) {
        return cached[hash]
      } else {
        find(hash).then(image => {
          cached[hash] = image
        })
      }
    }
  }
}()
