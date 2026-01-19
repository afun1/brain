import { useMemo, useRef, useState } from "react";
import type { SleepStage } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SleepProgressChartProps {
  stages: SleepStage[];
  elapsedTime: number;
  currentBeat: number;
  currentStageName: string;
  onSeek?: (time: number) => void;
}

const SLEEP_STAGES = [
  { name: "Awake", level: 0, minBeat: 12 },
  { name: "REM", level: 1, minBeat: 8 },
  { name: "N1", level: 2, minBeat: 6 },
  { name: "N2", level: 3, minBeat: 4 },
  { name: "N3", level: 4, minBeat: 0 },
];

function beatToStageLevel(beat: number): number {
  if (beat >= 12) return 0;
  if (beat >= 8) return 1;
  if (beat >= 6) return 2;
  if (beat >= 4) return 3;
  return 4;
}

function getStageName(level: number): string {
  return SLEEP_STAGES.find(s => s.level === level)?.name || "N3";
}

export function SleepProgressChart({ 
  stages, 
  elapsedTime, 
  currentBeat,
  currentStageName,
  onSeek
}: SleepProgressChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  
  const chartData = useMemo(() => {
    if (!stages || stages.length === 0) return { segments: [], totalDuration: 0 };
    
    const segments: { startTime: number; endTime: number; level: number; isREM: boolean }[] = [];
    let accumulatedTime = 0;
    
    stages.forEach((stage) => {
      const endLevel = beatToStageLevel(stage.endBeatFreq);
      const isREM = stage.name.toLowerCase().includes('rem') || 
                    stage.name.toLowerCase().includes('dream') ||
                    (stage.endBeatFreq >= 8 && stage.endBeatFreq <= 10);
      const level = isREM ? 1 : endLevel;
      
      segments.push({
        startTime: accumulatedTime,
        endTime: accumulatedTime + stage.durationSeconds,
        level,
        isREM,
      });
      
      accumulatedTime += stage.durationSeconds;
    });
    
    return { segments, totalDuration: accumulatedTime };
  }, [stages]);

  if (chartData.segments.length === 0) return null;

  const { segments, totalDuration } = chartData;
  
  const chartWidth = 400;
  const chartHeight = 140;
  const padding = { top: 15, right: 20, bottom: 30, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (time: number) => padding.left + (time / totalDuration) * innerWidth;
  const yScale = (level: number) => padding.top + (level / 4) * innerHeight;

  const buildStepPath = () => {
    const pathParts: string[] = [];
    
    segments.forEach((seg, i) => {
      const x1 = xScale(seg.startTime);
      const x2 = xScale(seg.endTime);
      const y = yScale(seg.level);
      
      if (i === 0) {
        pathParts.push(`M ${x1} ${y}`);
      } else {
        const prevY = yScale(segments[i - 1].level);
        if (prevY !== y) {
          pathParts.push(`L ${x1} ${prevY}`);
          pathParts.push(`L ${x1} ${y}`);
        }
      }
      pathParts.push(`L ${x2} ${y}`);
    });
    
    return pathParts.join(' ');
  };

  const buildREMSegments = () => {
    return segments.filter(seg => seg.isREM).map((seg, i) => {
      const x1 = xScale(seg.startTime);
      const x2 = xScale(seg.endTime);
      const y = yScale(seg.level);
      return (
        <line
          key={`rem-${i}`}
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke="#ef4444"
          strokeWidth="3"
          strokeLinecap="round"
        />
      );
    });
  };

  const totalHours = totalDuration / 3600;
  const hourMarks: number[] = [];
  for (let h = 0; h <= Math.ceil(totalHours); h++) {
    if (h * 3600 <= totalDuration) {
      hourMarks.push(h);
    }
  }
  if (hourMarks[hourMarks.length - 1] * 3600 < totalDuration) {
    hourMarks.push(Math.ceil(totalHours));
  }

  const minuteMarks: number[] = [];
  const minuteInterval = totalDuration <= 3600 ? 5 : totalDuration <= 7200 ? 15 : 30;
  for (let m = 0; m <= totalDuration / 60; m += minuteInterval) {
    const timeInSeconds = m * 60;
    if (timeInSeconds <= totalDuration && timeInSeconds % 3600 !== 0) {
      minuteMarks.push(timeInSeconds);
    }
  }

  const currentLevel = beatToStageLevel(currentBeat);
  const currentX = xScale(Math.min(elapsedTime, totalDuration));
  const currentY = yScale(currentLevel);
  const currentStageLevelName = getStageName(currentLevel);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0 && mins === 0) return `${hours}h`;
    if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}`;
    return `${mins}m`;
  };

  const formatTimeDetailed = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const getTimeFromMouseEvent = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgWidth = rect.width;
    const relativeX = (x / svgWidth) * chartWidth;
    
    if (relativeX < padding.left || relativeX > chartWidth - padding.right) {
      return null;
    }
    
    const timeRatio = (relativeX - padding.left) / innerWidth;
    const time = Math.max(0, Math.min(totalDuration, timeRatio * totalDuration));
    return { time, svgX: relativeX };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onSeek) return;
    const result = getTimeFromMouseEvent(e);
    if (result) {
      setHoverTime(result.time);
      setHoverX(result.svgX);
    } else {
      setHoverTime(null);
      setHoverX(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setHoverX(null);
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onSeek) return;
    const result = getTimeFromMouseEvent(e);
    if (result) {
      onSeek(result.time);
    }
  };

  const getStageAtTime = (time: number): string => {
    for (const seg of segments) {
      if (time >= seg.startTime && time < seg.endTime) {
        return seg.isREM ? "REM" : getStageName(seg.level);
      }
    }
    return getStageName(segments[segments.length - 1]?.level || 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ 
              backgroundColor: currentLevel === 1 ? "#ef4444" : 
                               currentLevel === 0 ? "#fbbf24" : 
                               currentLevel === 4 ? "#8b5cf6" : "#3b82f6"
            }}
          />
          <span className="font-medium text-white">{currentStageLevelName}</span>
          <span className="text-muted-foreground">({currentBeat.toFixed(1)} Hz)</span>
        </div>
        <span className="text-muted-foreground">
          {formatTime(elapsedTime)} / {formatTime(totalDuration)}
        </span>
      </div>

      <div className="relative bg-black/30 rounded-lg p-3 border border-white/10">
        {onSeek && (
          <div className="absolute top-1 right-1 text-[10px] text-muted-foreground/60 pointer-events-none">
            Click to seek
          </div>
        )}
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
          className={`w-full h-36 ${onSeek ? 'cursor-pointer' : ''}`}
          preserveAspectRatio="xMidYMid meet"
          data-testid="sleep-progress-chart"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {SLEEP_STAGES.map((stage) => (
            <line
              key={stage.name}
              x1={padding.left}
              y1={yScale(stage.level)}
              x2={padding.left + innerWidth}
              y2={yScale(stage.level)}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}

          {SLEEP_STAGES.map((stage) => (
            <text
              key={stage.name}
              x={padding.left - 8}
              y={yScale(stage.level)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground"
              style={{ fontSize: '11px', fontWeight: stage.name === "REM" ? 600 : 400 }}
            >
              {stage.name}
            </text>
          ))}

          <line 
            x1={padding.left} 
            y1={padding.top + innerHeight + 5} 
            x2={padding.left + innerWidth} 
            y2={padding.top + innerHeight + 5}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />

          {hourMarks.map((h) => {
            const x = xScale(h * 3600);
            return (
              <g key={`hour-${h}`}>
                <line
                  x1={x}
                  y1={padding.top + innerHeight + 5}
                  x2={x}
                  y2={padding.top + innerHeight + 12}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={chartHeight - 5}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: '11px' }}
                >
                  {h}
                </text>
              </g>
            );
          })}

          {minuteMarks.map((seconds) => {
            const x = xScale(seconds);
            return (
              <line
                key={`min-${seconds}`}
                x1={x}
                y1={padding.top + innerHeight + 5}
                x2={x}
                y2={padding.top + innerHeight + 9}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />
            );
          })}

          <path
            d={buildStepPath()}
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {buildREMSegments()}

          {/* Hover indicator */}
          {onSeek && hoverX !== null && hoverTime !== null && (
            <>
              <line
                x1={hoverX}
                y1={padding.top}
                x2={hoverX}
                y2={padding.top + innerHeight}
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1"
                strokeDasharray="2,2"
                pointerEvents="none"
              />
              <rect
                x={hoverX - 35}
                y={padding.top - 12}
                width={70}
                height={16}
                rx={4}
                fill="rgba(0,0,0,0.8)"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="0.5"
                pointerEvents="none"
              />
              <text
                x={hoverX}
                y={padding.top - 2}
                textAnchor="middle"
                fill="white"
                style={{ fontSize: '9px', fontWeight: 500 }}
                pointerEvents="none"
              >
                {formatTimeDetailed(hoverTime)} • {getStageAtTime(hoverTime)}
              </text>
            </>
          )}

          {elapsedTime > 0 && elapsedTime <= totalDuration && (
            <>
              <line
                x1={currentX}
                y1={padding.top}
                x2={currentX}
                y2={padding.top + innerHeight}
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                strokeDasharray="4,3"
                opacity="0.7"
              />
              <circle
                cx={currentX}
                cy={currentY}
                r="6"
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth="2"
                data-testid="progress-dot"
              />
              <circle
                cx={currentX}
                cy={currentY}
                r="10"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                opacity="0.4"
                className="animate-ping"
                style={{ transformOrigin: `${currentX}px ${currentY}px` }}
              />
            </>
          )}
        </svg>

        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-white rounded" />
            <span className="text-[10px] text-muted-foreground">Sleep Stages</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-red-500 rounded" />
            <span className="text-[10px] text-muted-foreground">REM</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <span className="text-xs text-muted-foreground">Stage: </span>
        <span className="text-xs text-primary font-medium">{currentStageName}</span>
      </div>
    </div>
  );
}

interface MiniHypnogramProps {
  stages: SleepStage[];
}

export function MiniHypnogram({ stages }: MiniHypnogramProps) {
  const chartData = useMemo(() => {
    if (!stages || stages.length === 0) return { segments: [], totalDuration: 0 };
    
    const segments: { startTime: number; endTime: number; level: number; isREM: boolean }[] = [];
    let accumulatedTime = 0;
    
    stages.forEach((stage) => {
      const endLevel = beatToStageLevel(stage.endBeatFreq);
      const isREM = stage.name.toLowerCase().includes('rem') || 
                    stage.name.toLowerCase().includes('dream') ||
                    (stage.endBeatFreq >= 8 && stage.endBeatFreq <= 10);
      const level = isREM ? 1 : endLevel;
      
      segments.push({
        startTime: accumulatedTime,
        endTime: accumulatedTime + stage.durationSeconds,
        level,
        isREM,
      });
      
      accumulatedTime += stage.durationSeconds;
    });
    
    return { segments, totalDuration: accumulatedTime };
  }, [stages]);

  if (chartData.segments.length === 0) return null;

  const { segments, totalDuration } = chartData;
  
  const chartWidth = 200;
  const chartHeight = 60;
  const padding = { top: 5, right: 5, bottom: 15, left: 5 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (time: number) => padding.left + (time / totalDuration) * innerWidth;
  const yScale = (level: number) => padding.top + (level / 4) * innerHeight;

  const buildStepPath = () => {
    const pathParts: string[] = [];
    
    segments.forEach((seg, i) => {
      const x1 = xScale(seg.startTime);
      const x2 = xScale(seg.endTime);
      const y = yScale(seg.level);
      
      if (i === 0) {
        pathParts.push(`M ${x1} ${y}`);
      } else {
        const prevY = yScale(segments[i - 1].level);
        if (prevY !== y) {
          pathParts.push(`L ${x1} ${prevY}`);
          pathParts.push(`L ${x1} ${y}`);
        }
      }
      pathParts.push(`L ${x2} ${y}`);
    });
    
    return pathParts.join(' ');
  };

  const buildREMSegments = () => {
    return segments.filter(seg => seg.isREM).map((seg, i) => {
      const x1 = xScale(seg.startTime);
      const x2 = xScale(seg.endTime);
      const y = yScale(seg.level);
      return (
        <line
          key={`rem-${i}`}
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
        />
      );
    });
  };

  const totalHours = Math.round(totalDuration / 3600);

  return (
    <div className="w-full">
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={buildStepPath()}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        
        {buildREMSegments()}
        
        <text
          x={padding.left}
          y={chartHeight - 3}
          fill="rgba(255,255,255,0.5)"
          fontSize="8"
        >
          0h
        </text>
        <text
          x={chartWidth - padding.right - 10}
          y={chartHeight - 3}
          fill="rgba(255,255,255,0.5)"
          fontSize="8"
        >
          {totalHours}h
        </text>
      </svg>
    </div>
  );
}
