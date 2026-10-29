import React from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface SpeedPoint {
  time: string;
  speedKb: number;
}

interface SpeedChartProps {
  data: SpeedPoint[];
  height?: number;
  compact?: boolean;
}

export const SpeedChart: React.FC<SpeedChartProps> = ({
  data,
  height = 50,
  compact = false,
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-[10px] text-slate-500 bg-black/20 rounded-lg border border-purple-500/10"
        style={{ height }}
      >
        Waiting for speed telemetry...
      </div>
    );
  }

  // Format speed for tooltip
  const formatSpeed = (kb: number) => {
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB/s`;
    return `${kb.toFixed(0)} KB/s`;
  };

  return (
    <div className="w-full rounded-lg overflow-hidden bg-black/30 border border-purple-500/15 p-1 relative">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id="speedPurpleGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c084fc" stopOpacity={0.65} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="speedCyanGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.65} />
              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          {!compact && (
            <XAxis dataKey="time" hide />
          )}
          {!compact && (
            <YAxis hide domain={["auto", "auto"]} />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const val = payload[0].value as number;
                return (
                  <div className="bg-slate-950/95 border border-purple-500/40 px-2 py-1 rounded text-[10px] shadow-lg text-purple-200">
                    <span className="font-semibold text-cyan-300">{formatSpeed(val)}</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="speedKb"
            stroke="#c084fc"
            strokeWidth={1.75}
            fillOpacity={1}
            fill="url(#speedPurpleGlow)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
