import { path } from './path.js'
import { ensureFileSync } from 'https://deno.land/std@0.129.0/fs/mod.ts'

export const config = function () {
  const configpath = path.root() + 'config.json'

  console.log(configpath)
  ensureFileSync(configpath)

  const file = Deno.readTextFileSync(configpath)

  let gotconfig

  if (file) {
    gotconfig = JSON.parse(file)
  } else {
    console.log('generating new config')
    gotconfig = {
      port: 8080,
      hostname: '0.0.0.0',
      url: 'localhost'
    }
    Deno.writeTextFileSync(configpath, JSON.stringify(gotconfig))
  }

  return {
    get: function () {
      return gotconfig
    }
  }
}()
