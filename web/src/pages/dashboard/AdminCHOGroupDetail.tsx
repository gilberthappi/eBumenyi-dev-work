import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Users,
  MapPin,
  Phone,
  UserPlus,
  Trash2,
  ArrowDownCircle,
  Search,
  X,
  CalendarDays,
  FileText,
} from "lucide-react";
import {
  adminGetGroupById,
  adminAddMember,
  adminRemoveMember,
  adminDemoteToCHW,
} from "@/services/choGroup.service";
import { getAllStudentsNoPagination, IStudent } from "@/services/students.service";
import { Button } from "@/components/common/Button";
import { formatDate } from "@/utils/formats/formats";

/* ─── Avatar ────────────────────────────────────────────────────────────────── */
const Avatar = ({
  name,
  photo,
  size = "w-10 h-10",
}: {
  name: string;
  photo: string | null;
  size?: string;
}) => {
  const [failed, setFailed] = useState(false);
  const initials = name?.substring(0, 2).toUpperCase() ?? "??";
  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${size} rounded-full object-cover shrink-0`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-full bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center text-sm font-bold shrink-0`}
    >
      {initials}
    </div>
  );
};

/* ─── Student search picker ─────────────────────────────────────────────────── */
const StudentSearchPicker = ({
  placeholder,
  roleFilter = "TRAINEE",
  onSelect,
  onClear,
  selected,
  excludeIds = [],
}: {
  placeholder: string;
  roleFilter?: string;
  onSelect: (s: IStudent) => void;
  onClear: () => void;
  selected: IStudent | null;
  excludeIds?: string[];
}) => {
  const [term, setTerm] = useState(selected?.fullName ?? "");
  const [debounced, setDebounced] = useState("");
  const [focused, setFocused] = useState(false);

  const debouncedSet = useCallback(debounce((v: string) => setDebounced(v), 350), []);

  const handleChange = (v: string) => {
    setTerm(v);
    debouncedSet(v);
    if (selected) onClear();
  };

  const { data, isFetching } = useQuery({
    queryKey: ["cho-group-picker", debounced, roleFilter],
    queryFn: () =>
      getAllStudentsNoPagination(
        debounced.length > 1
          ? `?searchq=${encodeURIComponent(debounced)}&role=${roleFilter}&noGroup=true&limit=8`
          : `?role=${roleFilter}&noGroup=true&limit=8`
      ),
    enabled: focused,
  });

  const results: IStudent[] = (data?.data ?? []).filter((s) => !excludeIds.includes(s.id));

  const pick = (s: IStudent) => {
    setTerm(s.fullName);
    setDebounced("");
    setFocused(false);
    onSelect(s);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={term}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD]"
        />
        {isFetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#3363AD]/30 border-t-[#3363AD] rounded-full animate-spin" />
        )}
        {selected && (
          <button
            type="button"
            onClick={() => { setTerm(""); onClear(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {focused && results.length > 0 && !selected && (
        <div className="absolute left-0 right-0 top-full mt-1 border border-gray-100 rounded-xl shadow-lg bg-white max-h-48 overflow-y-auto z-20">
          {results.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
            >
              <Avatar name={s.fullName} photo={null} size="w-8 h-8" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{s.fullName}</p>
                {s.phoneNumber && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {s.phoneNumber}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Page ──────────────────────────────────────────────────────────────────── */
const AdminCHOGroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addStudent, setAddStudent] = useState<IStudent | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showDemote, setShowDemote] = useState(false);
  const [newCHO, setNewCHO] = useState<IStudent | null>(null);

  const { data: group, isLoading } = useQuery({
    queryKey: ["admin-cho-group-detail", id],
    queryFn: () => adminGetGroupById(id!),
    enabled: !!id,
  });

  const { mutate: addMember, isPending: isAdding } = useMutation({
    mutationFn: () => adminAddMember(id!, addStudent!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cho-group-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-cho-groups"] });
      toast.success("CHW added to group.");
      setAddStudent(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to add member.");
    },
  });

  const { mutate: removeMember, isPending: isRemoving } = useMutation({
    mutationFn: (studentId: string) => adminRemoveMember(id!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cho-group-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-cho-groups"] });
      toast.success("CHW removed from group.");
      setRemovingId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to remove member.");
      setRemovingId(null);
    },
  });

  const { mutate: demoteCHO, isPending: isDemoting } = useMutation({
    mutationFn: () => adminDemoteToCHW(group!.cho!.user!.id, newCHO!.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cho-group-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-cho-groups"] });
      toast.success(`${data.demotedUser.fullNames} demoted. ${data.newCHO.fullNames} is now the CHO.`);
      setShowDemote(false);
      setNewCHO(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to demote CHO.");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <p className="text-gray-500">Group not found.</p>
        <Button size="sm" variant="ghost" onClick={() => navigate("/admin/cho-groups")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>
      </div>
    );
  }

  const members = group.members ?? [];
  const cho = group.cho?.user;

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/admin/cho-groups")}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#333333]">{group.name}</h2>
          <p className="text-sm text-gray-500">Group details and management</p>
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Group overview */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Group Info</p>
          <div className="space-y-2">
            {group.sector && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-[#3363AD] shrink-0" />
                <span>{group.sector}</span>
              </div>
            )}
            {group.description && (
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <FileText className="w-4 h-4 text-[#3363AD] shrink-0 mt-0.5" />
                <span>{group.description}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Users className="w-4 h-4 text-[#3363AD] shrink-0" />
              <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>Created {formatDate(group.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* CHO card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Community Health Officer
          </p>
          {cho ? (
            <div className="flex items-center gap-4">
              <Avatar name={cho.fullNames} photo={cho.photo} size="w-14 h-14" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-lg truncate">{cho.fullNames}</p>
                {cho.phoneNumber && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5" />
                    {cho.phoneNumber}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowDemote((v) => !v)}
                className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                  showDemote
                    ? "bg-amber-500 text-white"
                    : "text-amber-600 hover:bg-amber-50"
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" />
                Demote CHO
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No CHO assigned to this group.</p>
          )}

          {/* Demote section */}
          {showDemote && cho && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-amber-700">
                Select a replacement CHO from existing CHWs
              </p>
              <StudentSearchPicker
                placeholder="Search CHW by name…"
                roleFilter="TRAINEE"
                selected={newCHO}
                onSelect={setNewCHO}
                onClear={() => setNewCHO(null)}
              />
              <div className="flex gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setShowDemote(false); setNewCHO(null); }}
                  disabled={isDemoting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 !bg-amber-500 hover:!bg-amber-600"
                  disabled={!newCHO || isDemoting}
                  isLoading={isDemoting}
                  onClick={() => demoteCHO()}
                >
                  {!isDemoting && <ArrowDownCircle className="w-3.5 h-3.5 mr-1.5" />}
                  Confirm Demotion
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add CHW */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#3363AD]" />
          Add CHW to Group
        </h3>
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <StudentSearchPicker
              placeholder="Search CHW by name…"
              roleFilter="TRAINEE"
              selected={addStudent}
              onSelect={setAddStudent}
              onClear={() => setAddStudent(null)}
              excludeIds={members.map((m) => m.studentId)}
            />
          </div>
          <Button
            size="sm"
            onClick={() => addMember()}
            isLoading={isAdding}
            disabled={!addStudent || isAdding}
            className="shrink-0"
          >
            {!isAdding && <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
            Add
          </Button>
        </div>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#3363AD]" />
          Members
          <span className="text-xs font-normal text-gray-400">({members.length})</span>
        </h3>

        {members.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF0F9] flex items-center justify-center">
              <Users className="w-6 h-6 text-[#3363AD]/40" />
            </div>
            <p className="text-sm text-gray-500 font-medium">No members yet</p>
            <p className="text-xs text-gray-400">Use the search above to add CHWs to this group.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {members.map((m) => {
              const isBeingRemoved = removingId === m.studentId && isRemoving;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar name={m.student.user.fullNames} photo={m.student.user.photo} size="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{m.student.user.fullNames}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {m.student.user.phoneNumber && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {m.student.user.phoneNumber}
                        </p>
                      )}
                      {m.student.user.district && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {m.student.user.district}
                          {m.student.user.sector ? ` / ${m.student.user.sector}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0 hidden sm:block">
                    Joined {formatDate(m.joinedAt)}
                  </p>
                  <button
                    type="button"
                    disabled={isRemoving}
                    onClick={() => {
                      setRemovingId(m.studentId);
                      removeMember(m.studentId);
                    }}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40 shrink-0"
                    title="Remove from group"
                  >
                    {isBeingRemoved ? (
                      <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCHOGroupDetailPage;
