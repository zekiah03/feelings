'use client'
import { useEffect } from 'react'
import { contributeToTwin } from '@/lib/twin'

export function TwinContributor({
  appId,
  data,
}: {
  appId: string
  data: Record<string, unknown>
}) {
  useEffect(() => {
    contributeToTwin(appId, data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
