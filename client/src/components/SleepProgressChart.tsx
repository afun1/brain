import { useMemo } from "react";
import type { SleepStage } from "@shared/schema";

interface SleepProgressChartProps {
  stages: SleepStage[];
  elapsedTime: number;
  currentBeat: number;
  currentStageName: string;
}

const BRAINWAVE_ZONES = [
  { name: "Delta", min: 0, max: 4, color: "rgba(139, 92, 246, 0.3)" },
  { name: "Theta", min: 4, max: 8, color: "rgba(59, 130, 246, 0.3)" },
  { name: "Alpha", min: 8, max: 12, color: "rgba(34, 197, 94, 0.3)" },
  { name: "Beta", min: 12, max: 30, color: "rgba(251, 191, 36, 0.3)" },
];

export function SleepProgressChart({ 
  stages, 
  elapsedTime, 
  currentBeat,
  currentStageName 
}: SleepProgressChartProps) {
  const chartData = useMemo(() => {
    if (!stages || stages.length === 0) return { points: [], totalDuration: 0 };
    
    const points: { time: number; beat: number; stageName: string }[] = [];
    let accumulatedTime = 0;
    
    stages.forEach((stage) => {
      points.push({
        time: accumulatedTime,
        beat: stage.startBeatFreq,
        stageName: stage.name,
      });
      
      accumulatedTime += stage.durationSeconds;
      
      points.push({
        time: accumulatedTime,
        beat: stage.endBeatFreq,
        stageName: stage.name,
      });
    });
    
    return { points, totalDuration: accumulatedTime };
  }, [stages]);

  if (chartData.points.length === 0) return null;

  const { points, totalDuration } = chartData;
  const maxBeat = Math.max(...points.map(p => p.beat), 16);
  const minBeat = 0;
  const beatRange = maxBeat - minBeat;
  
  const chartWidth = 100;
  const chartHeight = 60;
  const padding = { top: 5, right: 5, bottom: 20, left: 30 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (time: number) => padding.left + (time / totalDuration) * innerWidth;
  const yScale = (beat: number) => padding.top + innerHeight - ((beat - minBeat) / beatRange) * innerHeight;

  const pathD = points.map((point, i) => {
    const x = xScale(point.time);
    const y = yScale(point.beat);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaD = pathD + ` L ${xScale(totalDuration)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;

  const currentX = xScale(Math.min(elapsedTime, totalDuration));
  const currentY = yScale(currentBeat);

  const getBrainwaveState = (freq: number): string => {
    if (freq < 4) return "Delta";
    if (freq < 8) return "Theta";
    if (freq < 12) return "Alpha";
    if (freq < 30) return "Beta";
    return "Gamma";
  };

  const currentState = getBrainwaveState(currentBeat);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ 
              backgroundColor: currentState === "Delta" ? "#8b5cf6" : 
                               currentState === "Theta" ? "#3b82f6" : 
                               currentState === "Alpha" ? "#22c55e" : "#fbbf24"
            }}
          />
          <span className="font-medium text-white">{currentState}</span>
          <span className="text-muted-foreground">({currentBeat.toFixed(1)} Hz)</span>
        </div>
        <span className="text-muted-foreground">
          {formatDuration(elapsedTime)} / {formatDuration(totalDuration)}
        </span>
      </div>

      <div className="relative bg-black/30 rounded-lg p-2 border border-white/10">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className="w-full h-32"
          preserveAspectRatio="none"
          data-testid="sleep-progress-chart"
        >
          {BRAINWAVE_ZONES.map((zone) => {
            if (zone.max <= minBeat || zone.min >= maxBeat) return null;
            const y1 = yScale(Math.min(zone.max, maxBeat));
            const y2 = yScale(Math.max(zone.min, minBeat));
            return (
              <g key={zone.name}>
                <rect
                  x={padding.left}
                  y={y1}
                  width={innerWidth}
                  height={y2 - y1}
                  fill={zone.color}
                />
                <text
                  x={padding.left - 2}
                  y={(y1 + y2) / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: '3px' }}
                >
                  {zone.name}
                </text>
              </g>
            );
          })}

          <line 
            x1={padding.left} 
            y1={padding.top + innerHeight} 
            x2={padding.left + innerWidth} 
            y2={padding.top + innerHeight}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.3"
          />
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={padding.top + innerHeight}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.3"
          />

          <defs>
            <linearGradient id="beatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <path
            d={areaD}
            fill="url(#beatGradient)"
          />

          <path
            d={pathD}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {elapsedTime > 0 && elapsedTime <= totalDuration && (
            <>
              <line
                x1={currentX}
                y1={padding.top}
                x2={currentX}
                y2={padding.top + innerHeight}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="0.3"
                strokeDasharray="1,1"
              />
              <circle
                cx={currentX}
                cy={currentY}
                r="2"
                fill="white"
                stroke="hsl(var(--primary))"
                strokeWidth="0.8"
                data-testid="progress-dot"
              />
              <circle
                cx={currentX}
                cy={currentY}
                r="3.5"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="0.4"
                opacity="0.5"
                className="animate-ping"
                style={{ transformOrigin: `${currentX}px ${currentY}px` }}
              />
            </>
          )}

          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <text
              key={pct}
              x={xScale(totalDuration * pct)}
              y={chartHeight - 2}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: '3px' }}
            >
              {formatDuration(totalDuration * pct)}
            </text>
          ))}
        </svg>

        <div className="flex justify-between mt-2 px-1">
          {BRAINWAVE_ZONES.slice(0, 4).map((zone) => (
            <div key={zone.name} className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: zone.color.replace('0.3', '0.8') }}
              />
              <span className="text-[10px] text-muted-foreground">{zone.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <span className="text-xs text-muted-foreground">Stage: </span>
        <span className="text-xs text-primary font-medium">{currentStageName}</span>
      </div>
    </div>
  );
}
