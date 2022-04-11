import { encode } from './lib/base64.js'

const kv = new IdbKvStore('inpfs')

export async function make (obj) {
  // the inner planetary file system creates a sha256 hash that we can use to look up the file 
  const hash = encode(
    new Uint8Array(await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(obj.file)
    ))
  )

  // the inner planetary naming system is a sha256 hash plus the file type. Ex "<hash>.md"
  // this way we know what the file is so we can render it
  const inpns = hash + '.' + obj.type
  console.log(hash + '.' + obj.type)
  console.log(obj.file)

  //and then we save the inpfs file using the inpns filename in the browser's IndexedDb for easy access
  kv.set(inpns, obj.file)
  return inpns
}

export async function find (inpns) {
  if (inpns.substring(44,45) === '.') {
    const hash = inpns.substring(0, 44)  

    const file = await kv.get(inpns)

    if (file) {
      const verify = encode(
        new Uint8Array(await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(file)
        ))
      )
        //inpfs checks to make sure the file has not been modified within the database before returning the request
      if (hash === verify) {
        return file
      }
    }
  }
}
