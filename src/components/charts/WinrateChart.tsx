'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'

interface SessionData {
    name: string
    winrate: number
    trades: number
}

interface WinrateChartProps {
    data: SessionData[]
}

export default function WinrateChart({ data }: WinrateChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Winrate by Session</CardTitle>
            </CardHeader>
            <CardContent>
                {data.some(d => d.trades > 0) ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data} layout="vertical">
                            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                            <YAxis type="category" dataKey="name" width={80} />
                            <Tooltip
                                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Winrate']}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="winrate" radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.winrate >= 50 ? 'hsl(var(--win))' : 'hsl(var(--loss))'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        Belum ada data trading
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
