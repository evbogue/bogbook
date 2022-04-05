import { keys } from './keys.js'
import { config } from './config.js'
import { serveDir } from "https://deno.land/std@0.129.0/http/file_server.ts"
import { green } from 'https://deno.land/std@0.129.0/fmt/colors.ts'

console.log(keys.pubkey())

const conf = config.get()

console.log(conf)

async function serve (conn) {
  const httpConn = Deno.serveHttp(conn)
  for await (const e of httpConn) {
    e.respondWith(serveDir(e.request, {fsRoot: '', showDirListing: true, quiet: true})).catch((error) => {
      try {
        conn.close() // coverup for a bug in Deno's http module that errors on connection close
      } catch {}
    })
  }
}

console.log(green('Listening') + ' at http://' + conf.url + ':' + conf.port + '/')

for await (const conn of Deno.listen({hostname: conf.hostname, port: conf.port})) {
  serve(conn)
}

