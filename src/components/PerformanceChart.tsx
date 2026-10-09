import React, { useState } from 'react';
import { ChartDataPoint } from '../types/simulation';

interface PerformanceChartProps {
  data: ChartDataPoint[];
  thresholdMs: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  thresholdMs
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center font-mono text-xs text-[#777777] bg-white border border-[#dcdcdc] rounded-[8px]">
        Awaiting telemetry data points...
      </div>
    );
  }

  // Calculate scales
  const maxDataVal = Math.max(...data.map(d => d.responseTimeMs), thresholdMs);
  const yMax = Math.ceil((maxDataVal * 1.15) / 50) * 50;
  const yMin = 0;

  // Viewbox coordinates
  const width = 800;
  const height = 280;
  const paddingLeft = 54;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return paddingTop + chartHeight - ((clamped - yMin) / (yMax - yMin)) * chartHeight;
  };

  // Generate SVG path for primary series
  const linePoints = data.map((d, i) => `${getX(i)},${getY(d.responseTimeMs)}`);
  const pathD = `M ${linePoints.join(' L ')}`;

  // Threshold Y coordinate
  const thresholdY = getY(thresholdMs);

  // Y-axis gridlines (4 steps)
  const yTicks = [
    0,
    Math.round(yMax * 0.33),
    Math.round(yMax * 0.66),
    yMax
  ];

  return (
    <div className="w-full bg-white rounded-[8px] p-5 md:p-6 border border-[#dcdcdc]">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 mb-4 border-b border-[#f0f0f0]">
        <div>
          <h3 className="font-cond text-xl md:text-2xl font-[700] uppercase tracking-[-0.02em] text-black">
            Response Time Telemetry
          </h3>
          <p className="font-body text-xs text-[#666666] mt-0.5">
            Simulated latency progression relative to safety threshold ({thresholdMs} ms)
          </p>
        </div>

        {/* Minimal Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#222222]">
            <span className="w-3 h-0.5 bg-[#000000] inline-block"></span>
            <span>Latency (ms)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#854d0e]">
            <span className="w-3 h-0.5 border-t border-dashed border-[#854d0e] inline-block"></span>
            <span>Threshold</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
        >
          {/* Subtle horizontal gridlines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#eaeaea"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  className="font-mono text-[10px] fill-[#888888]"
                >
                  {tick}ms
                </text>
              </g>
            );
          })}

          {/* Warning Threshold Line */}
          <line
            x1={paddingLeft}
            y1={thresholdY}
            x2={width - paddingRight}
            y2={thresholdY}
            stroke="#b45309"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          <text
            x={width - paddingRight}
            y={thresholdY - 5}
            textAnchor="end"
            className="font-mono text-[10px] fill-[#b45309]"
          >
            Threshold {thresholdMs}ms
          </text>

          {/* Primary latency series line */}
          <path
            d={pathD}
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.responseTimeMs);
            const isBreach = d.responseTimeMs >= thresholdMs;
            const isHovered = hoveredIndex === i;
            const isLast = i === data.length - 1;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4.5 : isLast ? 3.5 : 2.5}
                  fill={isBreach ? '#dc2626' : '#000000'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* X-axis labels */}
          {data.map((d, i) => {
            const shouldShow =
              i === 0 ||
              i === data.length - 1 ||
              i % Math.ceil(data.length / 6) === 0;

            if (!shouldShow) return null;

            return (
              <text
                key={i}
                x={getX(i)}
                y={height - 12}
                textAnchor="middle"
                className="font-mono text-[10px] fill-[#777777]"
              >
                {d.timeLabel}
              </text>
            );
          })}
        </svg>

        {/* Minimal Tooltip overlay */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute z-20 pointer-events-none bg-black text-white px-2.5 py-1.5 rounded-[4px] font-mono text-[11px] transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(getX(hoveredIndex) / width) * 100}%`,
              top: `${(getY(data[hoveredIndex].responseTimeMs) / height) * 100}%`,
              marginTop: '-8px'
            }}
          >
            <div className="font-semibold text-white">
              {data[hoveredIndex].responseTimeMs} ms
            </div>
            <div className="text-[10px] text-[#999999]">
              {data[hoveredIndex].requestRateRps} rps · {data[hoveredIndex].timeLabel}
            </div>
          </div>
        )}
      </div>

      {/* Footer Meta */}
      <div className="mt-3 pt-3 border-t border-[#f0f0f0] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#777777] gap-2">
        <div>
          Latest: <span className="font-semibold text-black">{data[data.length - 1].responseTimeMs} ms</span>
        </div>
        <div>
          Interval: 2.0s synthetic sample
        </div>
        <div>
          In-Memory Telemetry Buffer
        </div>
      </div>
    </div>
  );
};
