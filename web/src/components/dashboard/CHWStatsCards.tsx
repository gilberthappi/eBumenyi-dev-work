import React from "react";
import { Users, CheckCircle, ClipboardList, UserCheck } from "lucide-react";
import { ICHWStats } from "@/types";

interface CHWStatsCardsProps {
  data: ICHWStats | null;
  isLoading: boolean;
}

interface SubItem {
  label: string;
  value: number;
}

interface CardConfig {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  primary: string | number;
  subItems: SubItem[];
}

const CHWStatCard: React.FC<CardConfig> = ({
  icon,
  iconBg,
  iconColor,
  title,
  primary,
  subItems,
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow duration-200">
    {/* Main card content */}
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{primary}</p>
      </div>
    </div>

    {/* Sub items below */}
    {subItems.length > 0 && (
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          {subItems.map((item) => (
            <span
              key={item.label}
              className="text-xs font-medium text-[#3363AD]"
            >
              {item.value.toLocaleString()}{" "}
              <span className="font-normal text-gray-500">{item.label}</span>
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

export const CHWStatsCards: React.FC<CHWStatsCardsProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  const cards: CardConfig[] = [
    {
      icon: <Users size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Total CHW",
      primary: data?.chws.total ?? 0,
      subItems: [
        {
          label: "active",
          value: data?.chws.active ?? 0,
        },
        {
          label: "inactive",
          value: data?.chws.inactive ?? 0,
        },
      ],
    },
    {
      icon: <CheckCircle size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Course Completion",
      primary: `${data?.completion.rate ?? 0}%`,
      subItems: [
        {
          label: "courses completed",
          value: data?.completion.completed ?? 0,
        },
        {
          label: "enrollments",
          value: data?.completion.total ?? 0,
        },
      ],
    },
    {
      icon: <ClipboardList size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Test Attempts",
      primary: data?.tests.total ?? 0,
      subItems: [
        {
          label: "pre-test",
          value: data?.tests.preTest ?? 0,
        },
        // {
        //   label: "mid-test",
        //   value: data?.tests.midTest ?? 0,
        // },
        {
          label: "final-test",
          value: data?.tests.finalTest ?? 0,
        },
        {
          label: "final-exam",
          value: data?.tests.finalExam ?? 0,
        },
      ],
    },
    {
      icon: <UserCheck size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Total CHO",
      primary: data?.supervisors.total ?? 0,
      subItems: [
        {
          label: "male",
          value: data?.supervisors.male ?? 0,
        },
        {
          label: "female",
          value: data?.supervisors.female ?? 0,
        },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <CHWStatCard key={i} {...card} />
      ))}
    </div>
  );
};
