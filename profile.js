import { keys } from './keys.js'
import { cachekv } from './cachekv.js' 

export let profile = 'welcome'

cachekv.get('profile').then(data => {
  if (data) {
    profile = JSON.parse(data)
    console.log(profile)
  }
})
