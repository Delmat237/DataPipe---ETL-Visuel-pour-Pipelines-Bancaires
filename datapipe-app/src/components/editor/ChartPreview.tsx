'use client'

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ChartConfig } from '@/types/nodeConfigs'

interface Props {
  config: ChartConfig
  data: Record<string, unknown>[]
}

const DEFAULT_COLOR = '#ff6d35'

export function ChartPreview({ config, data }: Props) {
  const color = config.color ?? DEFAULT_COLOR
  const xKey = config.x_axis ?? ''
  const yKey = config.y_axis ?? ''

  if (!data.length || !xKey) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-600">
        Aucune donnée à afficher
      </div>
    )
  }

  const commonProps = {
    data,
    margin: { top: 8, right: 16, left: 0, bottom: 8 },
  }

  const axisStyle = { fill: '#6b7280', fontSize: 11 }
  const gridStyle = { stroke: '#1e1e1e' }
  const tooltipStyle = {
    contentStyle: { background: '#111111', border: '1px solid #2a2a2a', borderRadius: 8 },
    labelStyle: { color: '#e5e5e5' },
    itemStyle: { color: color },
  }

  return (
    <div className="w-full">
      {config.title && (
        <p className="text-xs font-semibold text-gray-400 text-center mb-3">{config.title}</p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        {config.chart_type === 'bar' ? (
          <BarChart {...commonProps}>
            <CartesianGrid {...gridStyle} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip {...tooltipStyle} />
            {config.show_legend !== false && <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />}
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : config.chart_type === 'line' ? (
          <LineChart {...commonProps}>
            <CartesianGrid {...gridStyle} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip {...tooltipStyle} />
            {config.show_legend !== false && <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />}
            <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        ) : config.chart_type === 'area' ? (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={40} />
            <Tooltip {...tooltipStyle} />
            {config.show_legend !== false && <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />}
            <Area type="monotone" dataKey={yKey} stroke={color} fill="url(#areaGrad)" strokeWidth={2} />
          </AreaChart>
        ) : (
          // Pie
          <PieChart>
            <Pie
              data={data}
              dataKey={yKey || xKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={85}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            {config.show_legend !== false && <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />}
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

const PIE_COLORS = [
  '#ff6d35', '#3b82f6', '#a855f7', '#00e5a0', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#8b5cf6',
]
