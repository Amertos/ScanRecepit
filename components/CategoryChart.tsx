import React from 'react';
import type { LineItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '../utils/currency';

interface CategoryChartProps {
  items: LineItem[];
  currency: string;
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ items, currency }) => {
  const chartData = items.map(item => ({
    name: item.description.length > 15 ? `${item.description.substring(0, 15)}...` : item.description,
    price: item.price,
  }));

  // Recharts doesn't play well with Tailwind/CSS vars directly in props,
  // so we get them imperatively. A bit of a hack, but necessary.
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();

  return (
    <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 50 }}>
                <CartesianGrid stroke="var(--card-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fill: textColor, fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: textColor, fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, currency)}
                  cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="price" fill={accentColor} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};