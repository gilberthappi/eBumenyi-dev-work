import { useState } from "react";
import StudentsList from "@/components/students/StudentList";
import StudentStatsCards from "@/components/students/StudentStatsCards";

const studentTabs = [
  { id: "students", label: "CHW", roleFilter: "TRAINEE" as const },
  { id: "testers", label: "Testers", roleFilter: "TESTER" as const },
];

const StudentsPage = () => {
  const [activeTab, setActiveTab] =
    useState<(typeof studentTabs)[number]["id"]>("students");

  const activeTabConfig =
    studentTabs.find((tab) => tab.id === activeTab) ?? studentTabs[0];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <h2 className='text-3xl font-bold text-[#333333]'>CHW</h2>
          <p className='text-sm text-gray-500'>
            Review trainee and tester records with the same analytics and table
            layout.
          </p>
        </div>
      </div>

      <div className='inline-flex rounded-2xl bg-white p-1 shadow-sm border border-gray-100'>
        {studentTabs.map((tab) => (
          <button
            key={tab.id}
            type='button'
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-[#3363AD] text-white shadow-sm"
                : "text-gray-600 hover:text-[#3363AD]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className='space-y-6'>
        <StudentStatsCards roleFilter={activeTabConfig.roleFilter} />
        <StudentsList hideHeader={true} roleFilter={activeTabConfig.roleFilter} />
      </div>
    </div>
  );
};

export default StudentsPage;
