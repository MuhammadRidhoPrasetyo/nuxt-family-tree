import { toNodeHandler } from 'better-auth/node'
import { auth } from '../../utils/auth'

export default defineEventHandler((event) => {
  return toNodeHandler(auth.handler)(event.node.req, event.node.res)
})

