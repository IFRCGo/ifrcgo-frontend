import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
  Cell,
  Bar,
  BarChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Text,
} from 'recharts';

import { sum } from '#utils/common';

import styles from './styles.module.scss';

interface PieChartData {
  key: number,
  name: string,
  value: number,
}

const PIE_COLORS = ['#f64752', '#fa999f', '#fdd6d9'];

interface PieChartProps {
  data: PieChartData[],
  className?: string;
}

function ThreeWPieChart(props: PieChartProps) {
  const {
    data = [],
    className,
  } = props;

  const total = sum(data, d => d.value) ?? 0;
  const chartData = React.useMemo(() => (
    data.sort((a, b) => a.name.localeCompare(b.name))
  ), [data]);

  return (
    <ResponsiveContainer
      className={_cs(styles.chartContainer, className)}
    >
      <PieChart
        margin={{
          right: 50,
          bottom: 30,
          left: 30,
          top: 30,
        }}
      >
        <Pie
          data={chartData}
          dataKey="value"
          labelLine={false}
        >
          { chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PIE_COLORS[index % PIE_COLORS.length]}
            />
          ))}
          <LabelList
            className={styles.pieLabel}
            position="outside"
            formatter={(v: number) => `${((100 * (v / total))).toFixed(1)}%`}
          />
        </Pie>
        <Legend
          iconType="circle"
          iconSize={10}
          verticalAlign="middle"
          align="right"
          layout="vertical"
          wrapperStyle={{
            right: 10,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function CustomYAxisTick (props: {
  y: number;
  payload: unknown;
  width: number;
}) {
  const {
    y,
    payload,
    width,
  } = props;


  const { value } = payload as { value: string };

  let fontSize = 12;

  if (value) {
    const nl = Math.sqrt(value.length);
    if (!Number.isNaN(nl)) {
      fontSize = Math.max(8, 16 - nl);
    }
  }

  return (
    <g transform={`translate(${0},${y})`}>
      <Text
        x={0}
        y={0}
        width={width}
        textAnchor="start"
        className={styles.tick}
        fontSize={fontSize}
        verticalAnchor="middle"
      >
        {value}
      </Text>
    </g>
  );
}

interface BarChartData {
  key: number | string;
  name: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[],
  className?: string;
  limitHeight?: boolean;
  hideTooltip?: boolean;
  hideLabel?: boolean;
}

function ThreeWBarChart(props: BarChartProps) {
  const {
    data,
    className,
    limitHeight,
    hideLabel,
    hideTooltip,
  } = props;

  const chartData = React.useMemo(() => {
    if (!data) {
      return [];
    }

    return [...data]
    .sort((a, b) => b.value - a.value)
    .splice(0, 5); // Only show top 5
  }, [data]);

  return (
    <ResponsiveContainer
      className={_cs(
        styles.chartContainer,
        className
      )}
      maxHeight={limitHeight ? 30*chartData.length : undefined}
    >
      <BarChart
        layout="vertical"
        data={chartData}
        margin={limitHeight ? {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        } : {
          top: 5,
          right: 30,
          bottom: 10,
          left: 10,
        }}
        barSize={10}
        barCategoryGap={2}
      >
        <XAxis type="number" hide={true} />
        <YAxis
          interval={0}
          dataKey="name"
          type="category"
          scale="band"
          axisLine={false}
          width={160}
          tick={CustomYAxisTick}
        />
        {!hideTooltip && (
          <Tooltip
            allowEscapeViewBox={{
              x: false,
              y: false,
            }}
          />
        )}
        <Bar
          radius={5}
          dataKey="value"
          fill="#f5333f"
        >
          {!hideLabel && (
            <LabelList
              className={styles.barLabel}
              dataKey="value"
              position="right"
            />
          )}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export { ThreeWPieChart, ThreeWBarChart };
