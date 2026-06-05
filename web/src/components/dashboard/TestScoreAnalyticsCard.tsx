import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/common/Card";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";
import { ITestScoreAnalytics } from "@/types";
import { BookOpen } from "lucide-react";

interface TestScoreAnalyticsCardProps {
  data: ITestScoreAnalytics | null;
}

export const TestScoreAnalyticsCard: React.FC<TestScoreAnalyticsCardProps> = ({
  data,
}) => {
  if (!data || data.byCourse.length === 0) {
    return (
      <Card>
        <DashboardSectionHeader icon={<BookOpen size={16} />} title='Test Scores' />
        <div className='flex items-center justify-center h-40 text-sm text-gray-400'>
          No data available
        </div>
      </Card>
    );
  }

  // Build chart data — only courses with at least one score
  const chartData = data.byCourse
    .filter((c) => c.meanPreTest !== null || c.meanFinalTest !== null)
    .map((c) => ({
      name:
        c.courseTitle.length > 16 ? c.courseTitle.slice(0, 16) + "…" : c.courseTitle,
      "Pre-test": c.meanPreTest ?? 0,
      "Final test": c.meanFinalTest ?? 0,
    }));

  const gain = data.overallKnowledgeGain;
  const GainIcon = gain > 0 ? TrendingUp : gain < 0 ? TrendingDown : Minus;
  const gainColor =
    gain > 0 ? "text-green-600" : gain < 0 ? "text-red-500" : "text-gray-400";

  return (
    <Card>
      <DashboardSectionHeader icon={<BookOpen size={16} />} title='Test Scores' />

      {/* Overall KPIs */}
      <div className='grid grid-cols-3 gap-3 mb-4'>
        <div className='bg-gray-50 rounded-lg p-3 text-center'>
          <p className='text-xs text-gray-500 mb-1'>Pre-training</p>
          <p className='text-xl font-bold text-gray-700'>
            {data.overallMeanPreTest > 0 ? `${data.overallMeanPreTest}%` : "—"}
          </p>
        </div>
        <div className='bg-gray-50 rounded-lg p-3 text-center'>
          <p className='text-xs text-gray-500 mb-1'>Post-training</p>
          <p className='text-xl font-bold text-[#3363AD]'>
            {data.overallMeanFinalTest > 0 ? `${data.overallMeanFinalTest}%` : "—"}
          </p>
        </div>
        <div className='bg-gray-50 rounded-lg p-3 text-center'>
          <p className='text-xs text-gray-500 mb-1'>Knowledge Gain</p>
          <div className={`flex items-center justify-center gap-1 ${gainColor}`}>
            <GainIcon size={14} />
            <p className='text-xl font-bold'>
              {gain !== 0 ? `${gain > 0 ? "+" : ""}${gain}%` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div style={{ height: 200 }}>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 20, bottom: 32 }}
              barSize={28}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='#f0f0f0'
                vertical={false}
              />
              <XAxis
                dataKey='name'
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Course",
                  position: "insideBottomRight",
                  offset: -8,
                  style: { fontSize: 10, fill: "#9ca3af" },
                }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Score (%)",
                  angle: -90,
                  position: "insideLeft",
                  dx: -12,
                  style: { fontSize: 10, fill: "#9ca3af", textAnchor: "middle" },
                }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey='Pre-test' fill='#6E95CB' radius={[3, 3, 0, 0]} />
              <Bar dataKey='Final test' fill='#3363AD' radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.byCourse.filter(
        (c) => c.meanPreTest !== null && c.meanFinalTest === null,
      ).length > 0 && (
        <p className='text-xs text-amber-600 mt-2'>
          * Some courses have no final test data yet
        </p>
      )}
    </Card>
  );
};
