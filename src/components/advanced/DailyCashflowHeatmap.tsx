import React, { useMemo, useState } from 'react';
import type { DailyHeatmapTimelinePoint } from '../../hooks/useStats';
import { formatCOP } from '../../utils/formatters';

type Props = {
  data: DailyHeatmapTimelinePoint[];
};

type Mode = 'all' | 'projected' | 'actual' | 'income';
type RangeMonths = 1 | 3 | 6;
type ActivityType = 'none' | 'projected_pending' | 'projected_paid' | 'actual' | 'income';

type CellData = {
  count: number;
  amount: number;
  type: ActivityType;
};

const MODE_OPTIONS: Array<{ value: Mode; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'projected', label: 'Proyectado' },
  { value: 'actual', label: 'No proyectado' },
  { value: 'income', label: 'Ingresos' }
];

const RANGE_OPTIONS: Array<{ value: RangeMonths; label: string }> = [
  { value: 1, label: '1M' },
  { value: 3, label: '3M' },
  { value: 6, label: '6M' }
];

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const CELL_SIZE = 14;
const CELL_GAP = 6;

const formatMonthShort = (date: Date) => {
  const raw = new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(date).replace('.', '').trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const getRangeWindow = (year: number, month: number, range: RangeMonths) => {
  if (range === 1) {
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0, 23, 59, 59, 999)
    };
  }

  if (range === 3) {
    return {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month + 2, 0, 23, 59, 59, 999)
    };
  }

  return {
    start: new Date(year, month - 4, 1),
    end: new Date(year, month + 2, 0, 23, 59, 59, 999)
  };
};

const getIntensity = (amount: number, maxValue: number) => {
  if (amount <= 0 || maxValue <= 0) return 0;

  const ratio = amount / maxValue;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
};

const getCellColor = (type: ActivityType, intensity: number) => {
  if (intensity === 0 || type === 'none') {
    return 'bg-slate-200/70 dark:bg-slate-800/80';
  }

  if (type === 'projected_pending') {
    return [
      'bg-amber-100 dark:bg-amber-300/35',
      'bg-amber-200 dark:bg-amber-300/50',
      'bg-amber-300 dark:bg-amber-300/70',
      'bg-amber-500 dark:bg-amber-300/90'
    ][intensity - 1];
  }

  if (type === 'projected_paid') {
    return [
      'bg-cyan-100 dark:bg-cyan-300/35',
      'bg-cyan-200 dark:bg-cyan-300/50',
      'bg-cyan-300 dark:bg-cyan-300/70',
      'bg-cyan-500 dark:bg-cyan-300/90'
    ][intensity - 1];
  }

  if (type === 'actual') {
    return [
      'bg-rose-100 dark:bg-rose-300/35',
      'bg-rose-200 dark:bg-rose-300/50',
      'bg-rose-300 dark:bg-rose-300/70',
      'bg-rose-500 dark:bg-rose-300/90'
    ][intensity - 1];
  }

  return [
    'bg-emerald-100 dark:bg-emerald-300/35',
    'bg-emerald-200 dark:bg-emerald-300/50',
    'bg-emerald-300 dark:bg-emerald-300/70',
    'bg-emerald-500 dark:bg-emerald-300/90'
  ][intensity - 1];
};

const getCellDataByMode = (point: DailyHeatmapTimelinePoint, mode: Mode): CellData => {
  const projectedPendingAmount = Math.max(0, point.projectedAmount - point.projectedPaidOnTimeAmount);
  const projectedPaidAmount = Math.min(point.projectedAmount, point.projectedPaidOnTimeAmount);
  const projectedPendingCount = Math.max(0, point.projectedCount - point.projectedPaidOnTimeCount);
  const projectedPaidCount = Math.max(0, point.projectedPaidOnTimeCount);

  if (mode === 'projected') {
    if (point.projectedAmount <= 0) {
      return { count: 0, amount: 0, type: 'none' };
    }

    if (projectedPendingCount > 0) {
      return { count: projectedPendingCount, amount: projectedPendingAmount, type: 'projected_pending' };
    }

    return { count: projectedPaidCount, amount: projectedPaidAmount, type: 'projected_paid' };
  }

  if (mode === 'actual') {
    return {
      count: point.actualCount,
      amount: point.actualAmount,
      type: point.actualAmount > 0 ? 'actual' : 'none'
    };
  }

  if (mode === 'income') {
    return {
      count: point.incomeCount,
      amount: point.incomeAmount,
      type: point.incomeAmount > 0 ? 'income' : 'none'
    };
  }

  const candidates: CellData[] = [
    {
      count: projectedPendingCount,
      amount: projectedPendingAmount,
      type: projectedPendingCount > 0 ? 'projected_pending' : 'none'
    },
    {
      count: projectedPaidCount,
      amount: projectedPaidAmount,
      type: projectedPaidCount > 0 ? 'projected_paid' : 'none'
    },
    {
      count: point.actualCount,
      amount: point.actualAmount,
      type: point.actualCount > 0 ? 'actual' : 'none'
    },
    {
      count: point.incomeCount,
      amount: point.incomeAmount,
      type: point.incomeCount > 0 ? 'income' : 'none'
    }
  ];

  return candidates.reduce(
    (max, current) => {
      if (current.count > max.count) {
        return current;
      }

      if (current.count === max.count && current.amount > max.amount) {
        return current;
      }

      return max;
    },
    { count: 0, amount: 0, type: 'none' }
  );
};

const formatCellTitle = (point: DailyHeatmapTimelinePoint) => {
  const projectedPendingAmount = Math.max(0, point.projectedAmount - point.projectedPaidOnTimeAmount);
  const projectedPaidAmount = Math.min(point.projectedAmount, point.projectedPaidOnTimeAmount);

  return [
    `${new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(point.date))}`,
    `Proyectado pendiente: ${formatCOP(projectedPendingAmount)}`,
    `Proyectado pagado en fecha: ${formatCOP(projectedPaidAmount)}`,
    `No proyectado: ${formatCOP(point.actualAmount)}`,
    `Ingresos: ${formatCOP(point.incomeAmount)}`
  ].join(' | ');
};

export default function DailyCashflowHeatmap({ data }: Props) {
  const [mode, setMode] = useState<Mode>('all');
  const [range, setRange] = useState<RangeMonths>(1);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const { start: rangeStartDate, end: rangeEndDate } = getRangeWindow(year, month, range);

  const visibleData = useMemo(() => {
    return data.filter((point) => {
      const d = new Date(point.date);
      return d >= rangeStartDate && d <= rangeEndDate;
    });
  }, [data, rangeStartDate, rangeEndDate]);

  const startLabel = new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' }).format(rangeStartDate);
  const endLabel = new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' }).format(rangeEndDate);
  const rangeLabel = startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;

  const countValues = useMemo(() => {
    return visibleData.map((point) => getCellDataByMode(point, mode).count).filter((value) => value > 0);
  }, [visibleData, mode]);

  const maxCount = Math.max(0, ...countValues);

  const firstVisibleDate = visibleData.length > 0 ? new Date(visibleData[0].date) : new Date(year, month, 1);
  const firstDayOffset = ((firstVisibleDate.getDay() + 6) % 7);
  const slots = Array.from({ length: firstDayOffset + visibleData.length }, (_, index) => {
    if (index < firstDayOffset) {
      return null;
    }

    return visibleData[index - firstDayOffset];
  });

  const columnCount = Math.max(1, Math.ceil(slots.length / 7));
  const gridWidth = columnCount * CELL_SIZE + Math.max(0, columnCount - 1) * CELL_GAP;

  const monthSegments = useMemo(() => {
    const starts: Array<{ col: number; label: string }> = [];

    slots.forEach((point, slotIndex) => {
      if (!point) return;

      const date = new Date(point.date);
      const isStart = date.getDate() === 1 || slotIndex === firstDayOffset;
      if (!isStart) return;

      const col = Math.floor(slotIndex / 7);
      const label = formatMonthShort(date);
      if (starts.length > 0 && starts[starts.length - 1].col === col) return;

      starts.push({ col, label });
    });

    return starts.map((start, index) => ({
      ...start,
      endCol: index < starts.length - 1 ? starts[index + 1].col - 1 : columnCount - 1
    }));
  }, [slots, firstDayOffset, columnCount]);

  const compactRangeLabel = useMemo(() => {
    if (monthSegments.length === 0) {
      return rangeLabel;
    }

    if (monthSegments.length === 1) {
      return monthSegments[0].label;
    }

    return `${monthSegments[0].label} - ${monthSegments[monthSegments.length - 1].label}`;
  }, [monthSegments, rangeLabel]);

  return (
    <section className="surface-card p-5 rounded-3xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-slate-500 dark:text-slate-400">Patrones diarios</p>
          <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">Heatmap de flujo mensual</h3>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 uppercase">{compactRangeLabel}</p>
        </div>
      </div>

      <div className="segment-control rounded-2xl p-1 inline-flex gap-1 w-fit">
        {RANGE_OPTIONS.map((option) => {
          const active = range === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setRange(option.value)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                active
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="segment-control rounded-2xl p-1 inline-flex gap-1 w-fit flex-wrap">
        {MODE_OPTIONS.map((option) => {
          const active = mode === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setMode(option.value)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                active
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
        <div className="min-w-[360px] flex gap-2">
          <div className="space-y-1.5">
            <div className="h-[14px]" aria-hidden />
            <div className="grid grid-rows-7 gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              {WEEKDAY_LABELS.map((dayLabel, index) => (
                <span key={`${dayLabel}-${index}`} className="h-3.5 leading-3.5">{dayLabel}</span>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="relative" style={{ width: `${gridWidth}px`, height: '14px' }}>
              {monthSegments.map((segment) => {
                const left = segment.col * (CELL_SIZE + CELL_GAP);
                const width = (segment.endCol - segment.col + 1) * CELL_SIZE + Math.max(0, segment.endCol - segment.col) * CELL_GAP;
                const center = left + width / 2;

                return (
                  <span
                    key={`${segment.label}-${segment.col}`}
                    className="absolute top-0 text-[10px] leading-3 text-slate-500 dark:text-slate-300 uppercase tracking-[0.08em]"
                    style={{ left: `${center}px`, transform: 'translateX(-50%)' }}
                  >
                    {segment.label}
                  </span>
                );
              })}
            </div>

              <div className="relative" style={{ width: `${gridWidth}px` }}>
              <div
                className="grid gap-1.5"
                style={{
                  gridAutoFlow: 'column',
                  gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
                  gridAutoColumns: `${CELL_SIZE}px`
                }}
              >
                {slots.map((point, index) => {
                  if (!point) {
                    return <div key={`empty-${index}`} className="h-3.5 w-3.5 rounded-[4px] bg-transparent" />;
                  }

                  const cellData = getCellDataByMode(point, mode);
                  const intensity = getIntensity(cellData.count, maxCount);
                  const colorClass = getCellColor(cellData.type, intensity);
                  const cellDate = new Date(point.date);
                  const isMonthStart = cellDate.getDate() === 1;
                  const isToday = cellDate.toDateString() === now.toDateString();

                  return (
                    <div
                      key={point.key}
                      title={formatCellTitle(point)}
                      className={`h-3.5 w-3.5 rounded-[4px] border border-slate-200/60 dark:border-slate-500/70 ${colorClass} ${
                        isToday
                          ? 'ring-2 ring-offset-1 ring-emerald-500 dark:ring-emerald-400 ring-offset-slate-50 dark:ring-offset-slate-800'
                          : isMonthStart
                          ? 'ring-2 ring-offset-1 ring-slate-300/90 dark:ring-slate-300/80 ring-offset-slate-50 dark:ring-offset-slate-800'
                          : ''
                      }`}
                    />
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded ring-2 ring-emerald-500" /> Hoy</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded ring-2 ring-slate-300/90" /> Inicio de mes</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-amber-400" /> Proyectado pendiente</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-cyan-500" /> Proyectado pagado en fecha</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-rose-500" /> No proyectado</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Ingreso recibido</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">La intensidad refleja cantidad de movimientos por dia.</span>
      </div>
    </section>
  );
}
