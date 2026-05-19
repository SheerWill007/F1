'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { PositionsResponse } from '@/types/f1';

interface Props {
  data: PositionsResponse;
  currentLap: number;
}

interface TooltipPayload {
  color: string;
  name: string;
  value: number;
  payload: Record<string, number>;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: number }) {
  if (!active || !payload || payload.length === 0) return null;

  const sorted = [...payload]
    .filter(p => p.value !== null && p.value !== undefined)
    .sort((a, b) => a.value - b.value);

  return (
    <div className="bg-f1-black border border-f1-gray/30 rounded p-3 text-xs font-mono shadow-2xl max-h-72 overflow-y-auto">
      <p className="text-f1-silver mb-2 font-bold">LAP {label}</p>
      {sorted.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="font-bold" style={{ color: p.color }}>P{p.value}</span>
          <span className="text-f1-silver">{p.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function PositionChart({ data, currentLap }: Props) {
  const drivers = useMemo(() => Object.values(data.drivers), [data.drivers]);

  const chartData = useMemo(() => {
    return data.laps
      .filter((l) => l.lap <= currentLap)
      .map((l) => {
        const row: Record<string, number | null> = { lap: l.lap };
        drivers.forEach((d) => {
          const pos = l.positions[d.code];
          row[d.code] = pos?.position ?? null;
        });
        return row;
      });
  }, [data.laps, drivers, currentLap]);

  const numDrivers = drivers.length;

  return (
    <div className="bg-f1-darkgray rounded-lg border border-f1-gray/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-f1-silver">
          Position Trace — {data.event}
        </h2>
        <span className="text-xs text-f1-gray">
          {currentLap}/{data.totalLaps} laps
        </span>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="lap"
            tick={{ fontSize: 10, fill: '#888', fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            label={{ value: 'Lap', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#888' }}
          />
          <YAxis
            reversed
            domain={[1, numDrivers]}
            ticks={Array.from({ length: numDrivers }, (_, i) => i + 1)}
            tick={{ fontSize: 10, fill: '#888', fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `P${v}`}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={currentLap} stroke="rgba(232,0,45,0.5)" strokeDasharray="4 2" />
          {drivers.map((d) => (
            <Line
              key={d.code}
              type="monotone"
              dataKey={d.code}
              stroke={d.color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: d.color, stroke: '#000', strokeWidth: 1 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Driver legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {drivers.map((d) => (
          <div key={d.code} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block w-4 h-0.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-f1-silver font-bold">{d.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
