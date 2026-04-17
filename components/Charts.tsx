
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

interface RevenueChartProps {
  data: any[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
      <Tooltip
        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
        itemStyle={{ color: '#fbbf24', fontWeight: 800 }}
        labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 700 }}
      />
      <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
    </AreaChart>
  </ResponsiveContainer>
);

interface PieChartProps {
  data: any[];
  colors: string[];
}

export const ExpensePieChart: React.FC<PieChartProps> = ({ data, colors }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={5}
        dataKey="value"
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
      />
      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
    </PieChart>
  </ResponsiveContainer>
);

interface BarChartProps {
  data: any[];
  color?: string;
  layout?: 'horizontal' | 'vertical';
}

export const PerformanceBarChart: React.FC<BarChartProps> = ({ data, color = '#f59e0b', layout = 'vertical' }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout={layout} margin={{ left: layout === 'vertical' ? 20 : 0, right: 30 }}>
      {layout === 'vertical' ? (
        <>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} width={80} />
        </>
      ) : (
        <>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
        </>
      )}
      <Tooltip
        cursor={{ fill: '#f8fafc' }}
        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
        itemStyle={{ color, fontWeight: 800 }}
      />
      <Bar dataKey={layout === 'vertical' ? 'value' : 'revenue'} fill={color} radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]} barSize={layout === 'vertical' ? 20 : 40}>
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={index === 0 ? color : '#94a3b8'} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);
