import { encode } from "./lib/base64.js"
import { cachekv } from "./cachekv.js"

export async function make(file) {
  const hash = encode(
    Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(file))
      )
    )
  )
  cachekv.put(hash, file)
  return hash
}

export async function find(hash) {
  const file = await cachekv.get(hash)

  if (file) {
    return file
  }
}
