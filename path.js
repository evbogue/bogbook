import {ensureDir} from 'https://deno.land/std@0.129.0/fs/mod.ts'

export const path = function () {
  const appdir = Deno.args[0] || 'ssbogs'
  const home = Deno.env.get('HOME')
  const fullpath = home + '/.' + appdir + '/'

  ensureDir(fullpath + 'ssbogs') 
  ensureDir(fullpath + 'inpfs') 

  console.log(fullpath)

  return {
    root: function () {
      return fullpath
    },
    bogs: function () {
      return fullpath + 'ssbogs'
    },
    inpfs: function () {
      return fullpath + 'inpfs'
    }
  }  
}()


