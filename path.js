import {ensureDir} from 'https://deno.land/std@0.143.0/fs/mod.ts'

export const path = function () {
  const appdir = Deno.args[0] || 'bogbookv3'
  const home = Deno.env.get('HOME')
  const fullpath = home + '/.' + appdir + '/'

  ensureDir(fullpath + 'blobs') 

  console.log(fullpath)

  return {
    root: function () {
      return fullpath
    },
    blobs: function () {
      return fullpath + 'blobs/'
    }
  }  
}()


