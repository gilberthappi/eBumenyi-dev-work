import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/common/Card";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";
import { IEnrollmentTrend } from "@/types";

interface EnrollmentTrendChartProps {
  trends: IEnrollmentTrend[];
}

export const EnrollmentTrendChart: React.FC<EnrollmentTrendChartProps> = ({
  trends,
}) => {
  if (!trends || trends.length === 0) {
    return (
      <Card>
        <DashboardSectionHeader
          icon={<TrendingUp size={16} />}
          title='Enrollment Trends'
        />
        <div className='flex items-center justify-center h-40 text-sm text-gray-400'>
          No data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <DashboardSectionHeader
        icon={<TrendingUp size={16} />}
        title='Enrollment Trends'
      />
      <div style={{ height: 260 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={trends}
            margin={{ top: 4, right: 8, left: 20, bottom: 32 }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' vertical={false} />
            <XAxis
              dataKey='month'
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Month",
                position: "insideBottomRight",
                offset: -8,
                style: { fontSize: 10, fill: "#9ca3af" },
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Enrollments",
                angle: -90,
                position: "insideLeft",
                dx: -12,
                style: {
                  fontSize: 10,
                  fill: "#9ca3af",
                  textAnchor: "middle",
                },
              }}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                boxShadow: "none",
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name,
              ]}
            />
            <Line
              type='monotone'
              dataKey='enrollments'
              stroke='#3363AD'
              strokeWidth={2}
              dot={{ fill: '#3363AD', r: 4 }}
              activeDot={{ r: 6 }}
              name='Enrollments'
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
