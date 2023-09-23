import { cachekv } from './cachekv.js'

export const log = async () => {
  const logs = await cachekv.get('log')
  console.log(logs)
  const arraystore = await cachekv.get('arraystore')
  return logs
}
