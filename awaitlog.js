import { cachekv } from './cachekv.js'

export const log = async () => {
  const logs = await cachekv.get('log')
  const arraystore = await cachekv.get('arraystore')
  return logs
}
