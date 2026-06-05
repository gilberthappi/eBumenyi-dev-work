import React, { useState } from "react";
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
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/common/Card";
import {
  ICourseAnalytics,
  ITestScoreAnalytics,
  ICourseDurationStats,
} from "@/types";

interface CourseChartsCardProps {
  courseAnalytics: ICourseAnalytics | null;
  testScores: ITestScoreAnalytics | null;
  courseDuration: ICourseDurationStats | null;
}

type ChartType = "completion" | "duration" | "testScore";

const CHART_OPTIONS: { value: ChartType; label: string }[] = [
  { value: "completion", label: "Course Completion" },
  { value: "duration", label: "Avg Duration per Course" },
  { value: "testScore", label: "Avg Test Score" },
];

// Truncate long course names for x-axis
const truncate = (str: string, n = 14) =>
  str.length > n ? str.slice(0, n) + "…" : str;

// Custom tooltip label style
const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  boxShadow: "none",
};

export const CourseChartsCard: React.FC<CourseChartsCardProps> = ({
  courseAnalytics,
  testScores,
  courseDuration,
}) => {
  const [activeChart, setActiveChart] = useState<ChartType>("completion");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeLabel =
    CHART_OPTIONS.find((o) => o.value === activeChart)?.label ?? "";

  // ── Chart 1: Completion — y=students, x=course ──────────────
  const completionData = (courseAnalytics?.coursePerformanceMetrics ?? []).map(
    (c) => ({
      name: truncate(c.name),
      Enrolled: c.students,
      Completed: c.completed,
    }),
  );

  // ── Chart 2: Avg duration — y=minutes, x=course ─────────────
  const durationData = (courseDuration?.byCourse ?? []).map((c) => ({
    name: truncate(c.courseTitle),
    "Avg Duration (min)": c.avgDurationMinutes,
  }));

  // ── Chart 3: Avg test score — y=%, x=course, 3 bars ─────────
  const testScoreData = (testScores?.byCourse ?? [])
    .filter((c) => c.meanPreTest !== null || c.meanFinalTest !== null)
    .map((c) => ({
      name: truncate(c.courseTitle),
      "Pre-Test": c.meanPreTest ?? 0,
      "Post-Test": c.meanFinalTest ?? 0,
      "Knowledge Gain": Math.max(c.knowledgeGain ?? 0, 0),
    }));

  const isEmpty =
    (activeChart === "completion" && completionData.length === 0) ||
    (activeChart === "duration" && durationData.length === 0) ||
    (activeChart === "testScore" && testScoreData.length === 0);

  return (
    <Card>
      {/* Header with dropdown */}
      <div className='flex items-center justify-between mb-5'>
        <h3 className='text-sm font-semibold text-gray-800'>Course Analytics</h3>

        {/* Dropdown */}
        <div className='relative'>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className='flex items-center gap-2 text-sm text-gray-600
                       border border-gray-200 rounded-lg px-3 py-1.5
                       hover:border-[#3363AD] hover:text-[#3363AD]
                       transition-colors focus:outline-none'
          >
            {activeLabel}
            <ChevronDown
              size={14}
              className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div
              className='absolute right-0 top-full mt-1 bg-white border
                         border-gray-200 rounded-xl shadow-lg z-20 min-w-[200px]
                         overflow-hidden'
            >
              {CHART_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setActiveChart(opt.value);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${
                      activeChart === opt.value
                        ? "bg-[#3363AD]/10 text-[#3363AD] font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart area */}
      {isEmpty ? (
        <div className='flex items-center justify-center h-52 text-sm text-gray-400'>
          No data available
        </div>
      ) : (
        <div style={{ height: 260 }}>
          <ResponsiveContainer width='100%' height='100%'>
            {activeChart === "completion" ? (
              <BarChart
                data={completionData}
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
                  tick={{ fontSize: 11 }}
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
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "CHW",
                    angle: -90,
                    position: "insideLeft",
                    dx: -12,
                    style: { fontSize: 10, fill: "#9ca3af", textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(),
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey='Enrolled'
                  fill='#82A5D6'
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey='Completed' fill='#3363AD' radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : activeChart === "duration" ? (
              <BarChart
                data={durationData}
                margin={{ top: 4, right: 8, left: 20, bottom: 32 }}
                barSize={48}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='#f0f0f0'
                  vertical={false}
                />
                <XAxis
                  dataKey='name'
                  tick={{ fontSize: 11 }}
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
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Duration (min)",
                    angle: -90,
                    position: "insideLeft",
                    dx: -12,
                    style: { fontSize: 10, fill: "#9ca3af", textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [`${value} min`, name]}
                />
                <Bar
                  dataKey='Avg Duration (min)'
                  fill='#3363AD'
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <BarChart
                data={testScoreData}
                margin={{ top: 4, right: 8, left: 20, bottom: 32 }}
                barSize={20}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='#f0f0f0'
                  vertical={false}
                />
                <XAxis
                  dataKey='name'
                  tick={{ fontSize: 11 }}
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
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  label={{
                    value: "Score (%)",
                    angle: -90,
                    position: "insideLeft",
                    dx: -12,
                    style: { fontSize: 10, fill: "#9ca3af", textAnchor: "middle" },
                  }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 11, marginTop: 8 }} />
                <Bar
                  dataKey='Pre-Test'
                  fill='#6E95CB'
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey='Post-Test' fill='#3363AD' radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey='Knowledge Gain'
                  fill='#4B7ABF'
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {dropdownOpen && (
        <div className='fixed inset-0 z-10' onClick={() => setDropdownOpen(false)} />
      )}
    </Card>
  );
};
