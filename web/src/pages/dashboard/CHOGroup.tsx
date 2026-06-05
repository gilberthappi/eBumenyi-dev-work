import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  BarChart2,
  UserPlus,
  MapPin,
  FileText,
  ChevronRight,
  CheckCircle2,
  Activity,
  TrendingUp,
} from "lucide-react";
import { getMyGroup, getGroupMonitoring } from "@/services/choGroup.service";
import { MetricCard } from "@/components/common/MetricCard";
import { Card } from "@/components/common/Card";

const CHOGroupPage = () => {
  const { data: group, isLoading, isError } = useQuery({
    queryKey: ["cho-group-mine"],
    queryFn: getMyGroup,
    retry: false,
  });

  const { data: monitoring } = useQuery({
    queryKey: ["cho-group-monitoring"],
    queryFn: getGroupMonitoring,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3363AD]" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
        <Users className="w-12 h-12 text-gray-300" />
        <p className="text-gray-600 font-semibold">No group assigned yet</p>
        <p className="text-gray-400 text-sm max-w-xs">
          You don't have a CHO group yet. Contact an administrator to set one up.
        </p>
      </div>
    );
  }

  const members = monitoring?.members ?? [];
  const memberCount = group._count?.members ?? 0;

  const avgProgress =
    members.length > 0
      ? Math.round(
          members.reduce((s, m) => {
            const a = m.courseProgress.length
              ? m.courseProgress.reduce((x, c) => x + c.progress, 0) / m.courseProgress.length
              : 0;
            return s + a;
          }, 0) / members.length,
        )
      : 0;

  const completedCount = members.filter((m) => m.courseProgress.some((c) => c.isCompleted)).length;
  const activeCount = members.filter((m) =>
    m.courseProgress.some((c) => c.progress > 0 && !c.isCompleted),
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#333333]">My Group</h2>
          <p className="text-sm text-gray-500">Manage your CHW group and monitor their progress.</p>
        </div>
      </div>

      {/* Group info card */}
      <Card padding={false} className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#EBF0F9] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-[#3363AD]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {group.sector && (
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{group.sector}</span>
                </div>
              )}
              {group.description && (
                <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="line-clamp-1">{group.description}</span>
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold text-[#3363AD]">{memberCount}</p>
            <p className="text-xs text-gray-400">Members</p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total CHWs"
          value={memberCount}
          icon={<Users size={18} />}
          iconBg="bg-[#EBF0F9]"
          iconColor="text-[#3363AD]"
        />
        <MetricCard
          title="Actively Learning"
          value={activeCount}
          icon={<Activity size={18} />}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
        />
        <MetricCard
          title="Completed a Course"
          value={completedCount}
          icon={<CheckCircle2 size={18} />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <MetricCard
          title="Avg Progress"
          value={`${avgProgress}%`}
          icon={<TrendingUp size={18} />}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            to: "/cho-group/members",
            Icon: Users,
            label: "Members",
            desc: "View and manage all CHWs in your group",
            iconBg: "bg-[#EBF0F9]",
            iconColor: "text-[#3363AD]",
          },
          {
            to: "/cho-group/monitoring",
            Icon: BarChart2,
            label: "Monitoring",
            desc: "Track course progress and test scores",
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
          },
          {
            to: "/cho-group/invite",
            Icon: UserPlus,
            label: "Add CHW",
            desc: "Add CHWs from your area directly to your group",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-500",
          },
        ].map(({ to, Icon, label, desc, iconBg, iconColor }) => (
          <Link
            key={to}
            to={to}
            className="group bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 group-hover:text-[#3363AD] transition-colors">
                {label}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#3363AD] transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CHOGroupPage;
