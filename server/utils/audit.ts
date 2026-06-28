import { db } from './db'
import { auditLogs } from '../database/schema'
import { getRequestIP, getHeader } from 'h3'

export async function logAction(
  event: any,
  payload: {
    userId: string | null
    familyId: string | null
    action: string
    tableName: string
    recordId: string | null
    oldValue?: any
    newValue?: any
  }
) {
  try {
    const ipAddress = getRequestIP(event, { xForwardedFor: true }) || null
    const userAgent = getHeader(event, 'user-agent') || null

    await db.insert(auditLogs).values({
      userId: payload.userId,
      familyId: payload.familyId,
      action: payload.action,
      tableName: payload.tableName,
      recordId: payload.recordId,
      oldValue: payload.oldValue || null,
      newValue: payload.newValue || null,
      ipAddress,
      userAgent
    })
  } catch (err) {
    console.error('Failed to log audit action:', err)
  }
}
