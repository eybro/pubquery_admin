'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RefreshCw } from 'lucide-react'

export type CounterRow = {
  venue_id: number
  name: string
  member_count: number
  non_member_count: number
  max_capacity?: number
  visible: 0 | 1 | boolean
  ratio_visible: 0 | 1 | boolean
  line_length?: string
  last_activity_at?: string
}

export type AuditItem = {
  id: number
  action: string
  organization_id: number
  username: string
  created_at: string
}

function timeAgoColor(last?: Date) {
  if (!last) return { label: 'No data', tone: 'neutral', text: '>3 hours' }
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - last.getTime()) / 60_000)
  if (diffMin < 60) return { label: 'OK', tone: 'success', text: `${diffMin} min` }
  if (diffMin < 180) return { label: 'Stale', tone: 'warning', text: `${Math.floor(diffMin / 60)} h` }
  return { label: 'Offline', tone: 'neutral', text: '>3 hours' }
}

function StatusBadge({ last }: { last?: string }) {
  const d = last ? new Date(last) : undefined
  const s = timeAgoColor(d)

  if (s.tone === 'success') {
    return <Badge className="bg-green-600 text-white">{s.text}</Badge>
  }
  if (s.tone === 'warning') {
    return <Badge className="bg-amber-500 text-black">{s.text}</Badge>
  }
  // neutral
  return <Badge variant="secondary">{s.text}</Badge>
}

export default function Page() {
  const [counters, setCounters] = useState<CounterRow[] | undefined>()
  const [loadingCounters, setLoadingCounters] = useState(true)
  const [logs, setLogs] = useState<AuditItem[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [cursor, setCursor] = useState<number | undefined>()
  const [refreshing, setRefreshing] = useState(false)

  const fetchCounters = useCallback(async () => {
    setLoadingCounters(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/monitor/counters`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed counters fetch')
      const data: CounterRow[] = await res.json()
      setCounters(data)
    } finally {
      setLoadingCounters(false)
    }
  }, [])

  const fetchLogs = useCallback(
    async (next?: boolean) => {
      if (next && cursor === undefined) return
      setLogsLoading(true)
      try {
        const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/monitor/logs`)
        if (next && cursor !== undefined) url.searchParams.set('cursor', String(cursor))
        url.searchParams.set('limit', '50')
        const res = await fetch(url.toString(), { credentials: 'include' })
        if (!res.ok) throw new Error('Failed logs fetch')
        const data: { items: AuditItem[]; nextCursor: number | null } = await res.json()
        if (next) setLogs((p) => [...p, ...data.items])
        else setLogs(data.items)
        setCursor(data.nextCursor ?? undefined)
      } finally {
        setLogsLoading(false)
      }
    },
    [cursor]
  )

  useEffect(() => {
    void fetchCounters()
    void fetchLogs()
  }, [fetchCounters, fetchLogs])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b bg-background/60 backdrop-blur-sm sm:h-16">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 hidden h-4 sm:block" />
            <h1 className="text-base font-semibold sm:text-xl">Super-Admin Monitor</h1>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                setRefreshing(true)
                setCursor(undefined) // reset paging
                await Promise.all([fetchCounters(), fetchLogs()]) // fetchLogs() without 'next' = newest page
                setRefreshing(false)
              }}
            >
              <RefreshCw className="mr-2 size-4" /> {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </header>

        <div className="w-full px-4 py-6 sm:px-6 md:p-10">
          <main className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-3">
            {/* Counters */}
            <Card className="rounded-2xl shadow-lg md:col-span-2">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Live Counters</h2>
                </div>
                {loadingCounters ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-11/12" />
                    <Skeleton className="h-6 w-10/12" />
                  </div>
                ) : (
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Venue</TableHead>
                          <TableHead className="text-right">Members</TableHead>
                          <TableHead className="text-right">Non-members</TableHead>
                          <TableHead className="text-right">Max cap</TableHead>
                          <TableHead>Visible</TableHead>
                          <TableHead>Ratio</TableHead>
                          <TableHead>Line</TableHead>
                          <TableHead>Socket</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {counters?.map((r) => {
                          const last = r.last_activity_at ? new Date(r.last_activity_at) : undefined
                          const hasLine = !!r.line_length && r.line_length !== 'no_line'
                          return (
                            <TableRow key={r.venue_id}>
                              <TableCell className="font-medium">{r.name}</TableCell>
                              <TableCell className="text-right">{r.member_count}</TableCell>
                              <TableCell className="text-right">{r.non_member_count}</TableCell>
                              <TableCell className="text-right">{r.max_capacity ?? '—'}</TableCell>

                              <TableCell>
                                <Badge
                                  className={r.visible ? 'bg-green-600 text-white' : ''}
                                  variant={r.visible ? undefined : 'secondary'}
                                >
                                  {r.visible ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  className={r.ratio_visible ? 'bg-green-600 text-white' : ''}
                                  variant={r.ratio_visible ? undefined : 'secondary'}
                                >
                                  {r.ratio_visible ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  className={hasLine ? 'bg-green-600 text-white' : ''}
                                  variant={hasLine ? undefined : 'secondary'}
                                >
                                  {r.line_length ?? '—'}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <StatusBadge last={r.last_activity_at} />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {last ? `Last activity: ${last.toLocaleString()}` : 'No socket activity recorded'}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Logs */}
            <Card className="rounded-2xl shadow-lg md:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Latest Admin Events</h2>
                </div>
                <div className="space-y-3">
                  {logs.length === 0 && logsLoading && (
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-11/12" />
                      <Skeleton className="h-5 w-10/12" />
                    </div>
                  )}

                  <ScrollArea className="h-[520px] pr-2">
                    <ul className="space-y-3">
                      {logs.map((l) => (
                        <li key={l.id} className="rounded-md border p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{l.action}</div>
                            <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            org #{l.organization_id} · {l.username}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>

                  <div className="flex items-center justify-center">
                    {cursor === undefined ? (
                      <div className="text-xs text-muted-foreground">No more items</div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => fetchLogs(true)} disabled={logsLoading}>
                        {logsLoading ? 'Loading…' : 'Load more'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
