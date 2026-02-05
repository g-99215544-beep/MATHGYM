import React, { useMemo } from 'react';

interface DataPoint {
  date: string;
  percentage: number;
  timestamp: number;
}

interface PerformanceLineChartProps {
  data: DataPoint[];
  operation?: string;
}

const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({ data, operation }) => {
  // Sort data by timestamp
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  const chartDimensions = {
    width: 800,
    height: 300,
    padding: { top: 20, right: 30, bottom: 60, left: 50 }
  };

  const chartWidth = chartDimensions.width - chartDimensions.padding.left - chartDimensions.padding.right;
  const chartHeight = chartDimensions.height - chartDimensions.padding.top - chartDimensions.padding.bottom;

  // Calculate scales
  const xScale = (index: number) => {
    if (sortedData.length <= 1) return chartWidth / 2;
    return (index / (sortedData.length - 1)) * chartWidth;
  };

  const yScale = (percentage: number) => {
    return chartHeight - (percentage / 100) * chartHeight;
  };

  // Create path for line
  const linePath = useMemo(() => {
    if (sortedData.length === 0) return '';

    return sortedData
      .map((point, index) => {
        const x = xScale(index);
        const y = yScale(point.percentage);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [sortedData]);

  // Calculate trend (increasing/decreasing)
  const trend = useMemo(() => {
    if (sortedData.length < 2) return 'neutral';
    const first = sortedData[0].percentage;
    const last = sortedData[sortedData.length - 1].percentage;
    const difference = last - first;

    if (difference > 5) return 'increasing';
    if (difference < -5) return 'decreasing';
    return 'stable';
  }, [sortedData]);

  const trendInfo = {
    increasing: {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      icon: '📈',
      message: 'Prestasi menunjukkan peningkatan yang baik!'
    },
    decreasing: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      icon: '📉',
      message: 'Prestasi menunjukkan penurunan. Perlu lebih fokus!'
    },
    stable: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      icon: '📊',
      message: 'Prestasi stabil. Teruskan usaha!'
    }
  };

  const currentTrend = trendInfo[trend];

  // Average percentage
  const avgPercentage = useMemo(() => {
    if (sortedData.length === 0) return 0;
    return Math.round(sortedData.reduce((sum, d) => sum + d.percentage, 0) / sortedData.length);
  }, [sortedData]);

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        Tiada data untuk dipaparkan
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            Analisis Graf Prestasi {operation ? `- ${operation}` : ''}
          </h3>
          <p className="text-sm text-slate-500">{sortedData.length} cubaan direkodkan</p>
        </div>
        <div className={`${currentTrend.bgColor} ${currentTrend.borderColor} border-2 rounded-xl px-4 py-2`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentTrend.icon}</span>
            <div>
              <div className={`text-sm font-bold ${currentTrend.color}`}>
                {trend === 'increasing' ? 'Meningkat' : trend === 'decreasing' ? 'Menurun' : 'Stabil'}
              </div>
              <div className="text-xs text-slate-600">Purata: {avgPercentage}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Message */}
      <div className={`${currentTrend.bgColor} ${currentTrend.borderColor} border rounded-lg p-3 mb-6`}>
        <p className={`text-sm font-semibold ${currentTrend.color}`}>
          {currentTrend.message}
        </p>
      </div>

      {/* Chart SVG */}
      <div className="overflow-x-auto">
        <svg
          width={chartDimensions.width}
          height={chartDimensions.height}
          className="mx-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          <g transform={`translate(${chartDimensions.padding.left}, ${chartDimensions.padding.top})`}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(percentage => (
              <g key={percentage}>
                <line
                  x1={0}
                  y1={yScale(percentage)}
                  x2={chartWidth}
                  y2={yScale(percentage)}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={-10}
                  y={yScale(percentage)}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="text-xs fill-slate-500"
                >
                  {percentage}%
                </text>
              </g>
            ))}

            {/* Average line */}
            <line
              x1={0}
              y1={yScale(avgPercentage)}
              x2={chartWidth}
              y2={yScale(avgPercentage)}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="8 4"
              opacity="0.5"
            />

            {/* Pass line (50%) */}
            <line
              x1={0}
              y1={yScale(50)}
              x2={chartWidth}
              y2={yScale(50)}
              stroke="#ef4444"
              strokeWidth="2"
              opacity="0.3"
            />

            {/* Line path */}
            <path
              d={linePath}
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {sortedData.map((point, index) => {
              const x = xScale(index);
              const y = yScale(point.percentage);
              const color = point.percentage > 50 ? '#22c55e' : '#ef4444';

              return (
                <g key={index}>
                  {/* Point circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="white"
                    stroke={color}
                    strokeWidth="3"
                  />

                  {/* Percentage label */}
                  <text
                    x={x}
                    y={y - 15}
                    textAnchor="middle"
                    className="text-xs font-bold"
                    fill={color}
                  >
                    {point.percentage}%
                  </text>

                  {/* Date label */}
                  <text
                    x={x}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    className="text-xs fill-slate-600"
                    transform={`rotate(-45, ${x}, ${chartHeight + 20})`}
                  >
                    {point.date}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-purple-500"></div>
          <span className="text-slate-600">Markah</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-500 opacity-50" style={{ borderTop: '2px dashed #3b82f6' }}></div>
          <span className="text-slate-600">Purata ({avgPercentage}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-red-500 opacity-30"></div>
          <span className="text-slate-600">Garis Lulus (50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-white"></div>
          <span className="text-slate-600">Lulus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-red-500 bg-white"></div>
          <span className="text-slate-600">Gagal</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceLineChart;
