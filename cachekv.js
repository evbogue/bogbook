const url = 'http://localhost:8000/'

const db = 'v1'

export const cachekv = {}

let cache

if ('caches' in window) {
  cache = await caches.open(db)

  cachekv.get = async function (key) {
    const file = await cache.match(url + key)
    try {
      const string = await file.text()
      return string
    } catch {
      return undefined
    }
  }
  
  cachekv.put = async function (key, string) {
    cache.put(url + key, new Response(string))
  }
  
  cachekv.rm = async function (key) {
    cache.delete(url + key)
  }
} else {
  console.log('No Cache API available')
}

