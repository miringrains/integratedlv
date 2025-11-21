'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ActivityChartProps {
  data: Array<{
    date: string
    tickets: number
    urgent: number
  }>
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3A443E" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3A443E" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorUrgent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6F12" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#FF6F12" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: '#6b716f' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#6b716f' }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              padding: '8px 12px'
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="urgent" 
            stroke="#FF6F12" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorUrgent)" 
            name="Urgent"
          />
          <Area 
            type="monotone" 
            dataKey="tickets" 
            stroke="#3A443E" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorTickets)" 
            name="Total Tickets"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

