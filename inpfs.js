import { encode } from './lib/base64.js'

const kv = new IdbKvStore('inpfs')

export async function make (file) {
  // the inner planetary file system creates a sha256 hash that we can use to look up the file 
  const hash = encode(
    new Uint8Array(await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(file)
    ))
  )

  //and then we save the inpfs file using the inpns filename in the browser's IndexedDb for easy access
  kv.set(hash, file)
  return hash
}

export async function find (inpns) {
  const file = await kv.get(inpns)

  if (file) {
    const verify = encode(
      new Uint8Array(await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(file)
      ))
    )
      //inpfs checks to make sure the file has not been modified within the database before returning the request
    if (inpns === verify) {
      return file
    }
  }
}
