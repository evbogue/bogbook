import { cachekv } from './cachekv.js'

export const log = async () => {
  const logs = await cachekv.get('log')
  return logs
}
