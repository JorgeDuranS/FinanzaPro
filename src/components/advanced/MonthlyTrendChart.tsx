import React, { useMemo, useState } from 'react';
import type { MonthlySeriesItem, DailyHeatmapTimelinePoint } from '../../hooks/useStats';
import { formatCOP } from '../../utils/formatters';

type Props = {
  series: MonthlySeriesItem[];
  dailyData?: DailyHeatmapTimelinePoint[];
};

const CHART_WIDTH = 320;
const CHART_HEIGHT = 140;
const PADDING = 18;

const makePath = (values: number[], maxValue: number) => {
  if (values.length === 0 || maxValue <= 0) return '';

  return values
    .map((value, index) => {
      const x = PADDING + (index * (CHART_WIDTH - PADDING * 2)) / Math.max(1, values.length - 1);
      const y = CHART_HEIGHT - PADDING - (value / maxValue) * (CHART_HEIGHT - PADDING * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};

const makeAreaPath = (values: number[], maxValue: number) => {
  const line = makePath(values, maxValue);
  if (!line) return '';
  const startX = PADDING;
  const endX = CHART_WIDTH - PADDING;
  const baseY = CHART_HEIGHT - PADDING;
  return `${line} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
};

const makePathFromPoints = (points: Array<{ x: number; y: number }>) => {
  if (points.length === 0) return '';

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
};

const getDayX = (day: number, daysInMonth: number) => {
  return PADDING + ((day - 1) * (CHART_WIDTH - PADDING * 2)) / Math.max(1, daysInMonth - 1);
};

const getValueY = (value: number, maxValue: number) => {
  return CHART_HEIGHT - PADDING - (value / maxValue) * (CHART_HEIGHT - PADDING * 2);
};

const getCurrentMonthSegment = (pointsCount: number, currentMonthIndex: number) => {
  if (pointsCount <= 1) {
    return {
      startX: PADDING,
      width: CHART_WIDTH - PADDING * 2,
      endX: CHART_WIDTH - PADDING
    };
  }

  const step = (CHART_WIDTH - PADDING * 2) / (pointsCount - 1);
  const clampedIndex = Math.max(0, Math.min(currentMonthIndex, pointsCount - 1));
  const endX = PADDING + clampedIndex * step;
  const startX = endX - step;
  return { startX, width: step, endX };
};

export default function MonthlyTrendChart({ series, dailyData }: Props) {
  const [range, setRange] = useState<1 | 3 | 6>(1);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const isOneMonthRange = range === 1;

  const monthFormatter = useMemo(() => new Intl.DateTimeFormat('es-CO', { month: 'short' }), []);

  const chartSeries = useMemo(() => {
    if (series.length === 0) return [];

    const pastCount = range === 1 ? 1 : range === 3 ? 2 : 5;
    const baseSeries = series.slice(-pastCount);

    if (range === 1) {
      return baseSeries;
    }

    const futureRef = new Date(currentYear, currentMonth + 1, 1);
    const futureMonth = futureRef.getMonth();
    const futureYear = futureRef.getFullYear();
    const futureItem: MonthlySeriesItem = {
      key: `${futureYear}-${futureMonth + 1}`,
      label: monthFormatter.format(futureRef).replace('.', ''),
      income: 0,
      spent: 0,
      savings: 0,
      balance: 0
    };

    return [...baseSeries, futureItem];
  }, [currentMonth, currentYear, monthFormatter, range, series]);

  const currentMonthDailyTotals = useMemo(() => {
    const totalsByDay = Array.from({ length: daysInCurrentMonth }, (_, index) => ({
      day: index + 1,
      income: 0,
      spent: 0
    }));

    if (!dailyData || dailyData.length === 0) {
      return totalsByDay;
    }

    for (const point of dailyData) {
      const pointDate = new Date(point.date);
      if (pointDate.getMonth() !== currentMonth || pointDate.getFullYear() !== currentYear) {
        continue;
      }

      const dayIndex = pointDate.getDate() - 1;
      if (dayIndex < 0 || dayIndex >= totalsByDay.length) {
        continue;
      }

      totalsByDay[dayIndex].income += Number(point.incomeAmount || 0);
      totalsByDay[dayIndex].spent += Number(point.actualAmount || 0) + Number(point.paidFixedAmount || 0);
    }

    return totalsByDay;
  }, [dailyData, currentMonth, currentYear, daysInCurrentMonth]);

  const incomeValues = chartSeries.map((item) => item.income);
  const spentValues = chartSeries.map((item) => item.spent);
  const monthIncomeTotal = currentMonthDailyTotals.reduce((acc, day) => acc + day.income, 0);
  const monthSpentTotal = currentMonthDailyTotals.reduce((acc, day) => acc + day.spent, 0);
  const monthAccumulatedSpent = currentMonthDailyTotals.reduce<number[]>((acc, day) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(prev + day.spent);
    return acc;
  }, []);
  const oneMonthMax = Math.max(1, monthIncomeTotal, monthSpentTotal, ...monthAccumulatedSpent);
  const monthlyMax = Math.max(1, ...incomeValues, ...spentValues, monthAccumulatedSpent[monthAccumulatedSpent.length - 1] || 0);
  const maxValue = isOneMonthRange ? oneMonthMax : monthlyMax;
  const incomePath = isOneMonthRange
    ? makePathFromPoints([
      { x: getDayX(1, daysInCurrentMonth), y: getValueY(0, maxValue) },
      { x: getDayX(daysInCurrentMonth, daysInCurrentMonth), y: getValueY(monthIncomeTotal, maxValue) }
    ])
    : makePath(incomeValues, maxValue);
  const spentPath = isOneMonthRange
    ? makePathFromPoints([
      { x: getDayX(1, daysInCurrentMonth), y: getValueY(0, maxValue) },
      { x: getDayX(daysInCurrentMonth, daysInCurrentMonth), y: getValueY(monthSpentTotal, maxValue) }
    ])
    : makePath(spentValues, maxValue);
  
  const accumulatedPath = useMemo(() => {
    if (monthAccumulatedSpent.length < 2) return '';

    if (isOneMonthRange) {
      const points = monthAccumulatedSpent.map((amount, index) => ({
        x: getDayX(index + 1, daysInCurrentMonth),
        y: getValueY(amount, maxValue)
      }));

      return makePathFromPoints(points);
    }

    if (chartSeries.length === 0) return '';

    const currentMonthIndex = Math.max(0, chartSeries.length - 2);
    const { startX, width: segmentWidth } = getCurrentMonthSegment(chartSeries.length, currentMonthIndex);
    const points = monthAccumulatedSpent.map((amount, index) => ({
      x: startX + (index * segmentWidth) / Math.max(1, daysInCurrentMonth - 1),
      y: getValueY(amount, maxValue)
    }));

    return makePathFromPoints(points);
  }, [chartSeries, daysInCurrentMonth, isOneMonthRange, maxValue, monthAccumulatedSpent]);
  const incomeArea = isOneMonthRange ? '' : makeAreaPath(incomeValues, maxValue);
  const spentArea = isOneMonthRange ? '' : makeAreaPath(spentValues, maxValue);
  const latest = series[series.length - 1];
  const previous = series[series.length - 2];
  const hasPreviousData = previous && (previous.spent > 0 || previous.income > 0);
  const delta = hasPreviousData ? (((latest?.spent || 0) - previous.spent) / Math.max(1, previous.spent)) * 100 : 0;
  const latestNet = (latest?.income || 0) - (latest?.spent || 0);

  const pointFor = (values: number[], index: number) => {
    const x = PADDING + (index * (CHART_WIDTH - PADDING * 2)) / Math.max(1, values.length - 1);
    const y = CHART_HEIGHT - PADDING - (values[index] / maxValue) * (CHART_HEIGHT - PADDING * 2);
    return { x, y };
  };

  const incomeLastPoint = isOneMonthRange
    ? { x: getDayX(daysInCurrentMonth, daysInCurrentMonth), y: getValueY(monthIncomeTotal, maxValue) }
    : incomeValues.length > 0 ? pointFor(incomeValues, incomeValues.length - 1) : null;
  const spentLastPoint = isOneMonthRange
    ? { x: getDayX(daysInCurrentMonth, daysInCurrentMonth), y: getValueY(monthSpentTotal, maxValue) }
    : spentValues.length > 0 ? pointFor(spentValues, spentValues.length - 1) : null;
  
  const accumulatedLastPoint = useMemo(() => {
    if (monthAccumulatedSpent.length === 0) return null;

    if (isOneMonthRange) {
      return {
        x: getDayX(daysInCurrentMonth, daysInCurrentMonth),
        y: getValueY(monthAccumulatedSpent[monthAccumulatedSpent.length - 1], maxValue)
      };
    }

    if (chartSeries.length === 0) return null;

    const currentMonthIndex = Math.max(0, chartSeries.length - 2);
    const { endX: x } = getCurrentMonthSegment(chartSeries.length, currentMonthIndex);
    const y = getValueY(monthAccumulatedSpent[monthAccumulatedSpent.length - 1], maxValue);

    return { x, y };
  }, [chartSeries, daysInCurrentMonth, isOneMonthRange, maxValue, monthAccumulatedSpent]);

  return (
    <section className="surface-card p-5 rounded-3xl space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-slate-500 dark:text-slate-400">Tendencia</p>
          <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">Historial mensual</h3>
        </div>
        <div className="text-right text-xs space-y-0.5">
          <p className="text-emerald-600 dark:text-emerald-300 font-bold">Ingresos (mes)</p>
          <p className="text-rose-500 font-bold">Gastos (mes)</p>
          {hasPreviousData && (
            <p className={`font-semibold ${delta <= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
              {delta <= 0 ? 'Bajando' : 'Subiendo'} {Math.abs(delta).toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      <div className="segment-control rounded-2xl p-1 inline-flex gap-1 w-fit">
        {[1, 3, 6].map((value) => {
          const active = range === value;
          return (
            <button
              key={value}
              onClick={() => setRange(value as 1 | 3 | 6)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] transition-colors ${
                active
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {value}M
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="metric-pill">
          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Gasto ultimo mes</p>
          <p className="text-sm font-display font-bold text-rose-600">{formatCOP(latest?.spent || 0)}</p>
        </div>
        <div className="metric-pill">
          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Neto ultimo mes</p>
          <p className={`text-sm font-display font-bold ${latestNet >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600'}`}>
            {formatCOP(latestNet)}
          </p>
        </div>
      </div>

      {chartSeries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No hay historial suficiente para construir la grafica mensual.</p>
      ) : (
        <>
          <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-slate-700/80">
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-36">
              <line x1={PADDING} y1={CHART_HEIGHT * 0.3} x2={CHART_WIDTH - PADDING} y2={CHART_HEIGHT * 0.3} stroke="rgba(100,116,139,0.2)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={PADDING} y1={CHART_HEIGHT * 0.55} x2={CHART_WIDTH - PADDING} y2={CHART_HEIGHT * 0.55} stroke="rgba(100,116,139,0.2)" strokeWidth="1" strokeDasharray="4 4" />
              <path d={incomeArea} fill="rgba(16,185,129,0.12)" />
              <path d={spentArea} fill="rgba(244,63,94,0.1)" />
              <line x1={PADDING} y1={CHART_HEIGHT - PADDING} x2={CHART_WIDTH - PADDING} y2={CHART_HEIGHT - PADDING} stroke="rgba(100,116,139,0.35)" strokeWidth="1" />
              <path d={incomePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
               {spentPath ? <path d={spentPath} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" /> : null}
               {incomeLastPoint ? <circle cx={incomeLastPoint.x} cy={incomeLastPoint.y} r="3.5" fill="#10b981" /> : null}
               {spentLastPoint ? <circle cx={spentLastPoint.x} cy={spentLastPoint.y} r="3.5" fill="#f43f5e" /> : null}
               {isOneMonthRange ? (
                 [1, Math.ceil(daysInCurrentMonth / 2), daysInCurrentMonth].map((day) => (
                   <text
                     key={`day-axis-${day}`}
                     x={getDayX(day, daysInCurrentMonth)}
                     y={CHART_HEIGHT - 4}
                     textAnchor="middle"
                     fontSize="8"
                     fill="#94a3b8"
                   >
                     {day}
                   </text>
                 ))
               ) : (
                  chartSeries.map((item, index) => (
                   <text 
                     key={item.key}
                      x={PADDING + (index * (CHART_WIDTH - PADDING * 2)) / Math.max(1, chartSeries.length - 1)}
                     y={CHART_HEIGHT - 4}
                     textAnchor="middle"
                     fontSize="8"
                     fill="#94a3b8"
                   >
                     {item.label}
                   </text>
                 ))
                )}
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            {chartSeries.map((item) => (
              <div key={item.key} className="rounded-xl bg-slate-100/70 dark:bg-slate-800/70 px-2 py-1.5">
                <p className="uppercase font-bold tracking-wide text-slate-700 dark:text-slate-200">{item.label}</p>
                <p>I: {formatCOP(item.income)}</p>
                <p>G: {formatCOP(item.spent)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
