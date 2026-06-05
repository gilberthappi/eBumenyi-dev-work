import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import Modal from "@/components/common/Modal";
import { toast } from "react-hot-toast";
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type IAnnouncement,
} from "@/services/announcement.service";

const Announcement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<IAnnouncement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">(
    "all",
  );
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    announcement: IAnnouncement | null;
  }>({
    isOpen: false,
    announcement: null,
  });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    segment: "",
    publishAt: new Date().toISOString().split("T")[0],
    validUntil: "",
    priority: "medium" as "high" | "medium" | "low",
    status: "draft" as "draft" | "published",
  });

  const categories = [
    "Training",
    "Maintenance",
    "Health Alert",
    "Updates",
    "Events",
    "Partnerships",
  ];
  const segmentOptions = [
    "all",
    "ADMIN",
    "TRAINER",
    "CHO",
    "TRAINEE",
    "TESTER",
    "DEVELOPER",
    "ADMINISTRATOR",
    "STAFF",
  ];

  // Fetch announcements using useQuery
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const response = await getAllAnnouncements();
      return response.data;
    },
  });

  // Mutation for creating announcement
  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createAnnouncement>[0]) =>
      createAnnouncement(payload),
    onSuccess: () => {
      toast.success("Announcement created successfully");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Error creating announcement";
      console.error("Error creating announcement:", error);
      toast.error(errorMessage);
    },
  });

  // Mutation for updating announcement
  const updateMutation = useMutation({
    mutationFn: (params: {
      id: string;
      payload: Parameters<typeof updateAnnouncement>[1];
    }) => updateAnnouncement(params.id, params.payload),
    onSuccess: () => {
      toast.success("Announcement updated successfully");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setIsDialogOpen(false);
      setEditingAnnouncement(null);
      resetForm();
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Error updating announcement";
      console.error("Error updating announcement:", error);
      toast.error(errorMessage);
    },
  });

  // Mutation for deleting announcement
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      toast.success("Announcement deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setDeleteConfirm({ isOpen: false, announcement: null });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Error deleting announcement";
      console.error("Error deleting announcement:", error);
      toast.error(errorMessage);
    },
  });

  // Mutation for toggling status
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => {
      const announcement = announcements.find((a) => a.id === id);
      if (!announcement) throw new Error("Announcement not found");
      const newStatus = announcement.status === "published" ? "draft" : "published";
      return updateAnnouncement(id, { status: newStatus });
    },
    onSuccess: () => {
      toast.success("Announcement status updated");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Error updating announcement";
      console.error("Error updating status:", error);
      toast.error(errorMessage);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      body: "",
      segment: "",
      publishAt: new Date().toISOString().split("T")[0],
      validUntil: "",
      priority: "medium",
      status: "draft",
    });
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const matchesSearch =
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.body.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || announcement.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || announcement.priority === priorityFilter;
      const matchesCategory =
        categoryFilter === "all" || announcement.segment === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [announcements, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status?: string) => {
    return status === "published"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditAnnouncement = (announcement: IAnnouncement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      body: announcement.body,
      segment: announcement.segment,
      publishAt: announcement.publishAt.split("T")[0],
      validUntil: announcement.validUntil
        ? announcement.validUntil.split("T")[0]
        : "",
      priority: announcement.priority || "medium",
      status: announcement.status || "draft",
    });
    setIsDialogOpen(true);
  };

  const handleSaveAnnouncement = async () => {
    if (!formData.title || !formData.body || !formData.segment) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      title: formData.title,
      body: formData.body,
      segment: formData.segment,
      publishAt: formData.publishAt,
      validUntil: formData.validUntil || null,
      priority: formData.priority,
      status: formData.status,
    };

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeleteAnnouncement = (announcement: IAnnouncement) => {
    setDeleteConfirm({ isOpen: true, announcement });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.announcement) return;
    deleteMutation.mutate(deleteConfirm.announcement.id);
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 pb-12'>
      {/* Header Section - iOS Style */}
      <div className='bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4'>
            <div>
              <h1 className='text-4xl font-bold bg-primary  to-indigo-600 bg-clip-text text-transparent'>
                Announcements
              </h1>
              <p className='text-gray-600 mt-2 text-sm font-medium'>
                Create and manage community announcements with ease
              </p>
            </div>
            <Button
              onClick={handleCreateAnnouncement}
              className='flex items-center gap-2 bg-primary to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6 h-12'
            >
              <PlusIcon className='w-5 h-5' />
              <span className='font-semibold'>New Announcement</span>
            </Button>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 mt-8'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='group relative bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-6 hover:bg-white/60 transition-all duration-300 shadow-sm hover:shadow-md'>
            <div className='absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent rounded-2xl' />
            <div className='relative'>
              <p className='text-gray-600 text-sm font-medium mb-2'>
                Total Announcements
              </p>
              <p className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                {isLoading ? "-" : announcements.length}
              </p>
            </div>
          </div>

          <div className='group relative bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-6 hover:bg-white/60 transition-all duration-300 shadow-sm hover:shadow-md'>
            <div className='absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent rounded-2xl' />
            <div className='relative'>
              <p className='text-gray-600 text-sm font-medium mb-2'>Published</p>
              <p className='text-4xl font-bold text-green-600'>
                {isLoading
                  ? "-"
                  : announcements.filter((a) => a.status === "published").length}
              </p>
            </div>
          </div>

          <div className='group relative bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-6 hover:bg-white/60 transition-all duration-300 shadow-sm hover:shadow-md'>
            <div className='absolute inset-0 bg-gradient-to-br from-gray-400/10 to-transparent rounded-2xl' />
            <div className='relative'>
              <p className='text-gray-600 text-sm font-medium mb-2'>Drafts</p>
              <p className='text-4xl font-bold text-gray-700'>
                {isLoading
                  ? "-"
                  : announcements.filter((a) => a.status === "draft").length}
              </p>
            </div>
          </div>

          <div className='group relative bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-6 hover:bg-white/60 transition-all duration-300 shadow-sm hover:shadow-md'>
            <div className='absolute inset-0 bg-gradient-to-br from-red-400/10 to-transparent rounded-2xl' />
            <div className='relative'>
              <p className='text-gray-600 text-sm font-medium mb-2'>High Priority</p>
              <p className='text-4xl font-bold text-red-600'>
                {isLoading
                  ? "-"
                  : announcements.filter((a) => a.priority === "high").length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section - iOS Style */}
        <div className='bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <FunnelIcon className='w-5 h-5 text-blue-600' />
            Filters & Search
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3'>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                Search
              </label>
              <div className='relative'>
                <Input
                  placeholder='Search...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full pl-10 rounded-xl border-gray-300 focus:border-primary'
                />
                <div className='absolute left-3 top-3 text-gray-400'>🔍</div>
              </div>
            </div>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                Status
              </label>
              <select
                className='w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur transition-all'
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "published" | "draft")
                }
              >
                <option value='all'>All Status</option>
                <option value='published'>Published</option>
                <option value='draft'>Draft</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                Priority
              </label>
              <select
                className='w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur transition-all'
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(
                    e.target.value as "all" | "high" | "medium" | "low",
                  )
                }
              >
                <option value='all'>All Priority</option>
                <option value='high'>🔴 High</option>
                <option value='medium'>🟡 Medium</option>
                <option value='low'>🟢 Low</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>
                Category
              </label>
              <select
                className='w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white/80 backdrop-blur transition-all'
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value='all'>All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex items-end'>
              <Button
                variant='outline'
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setCategoryFilter("all");
                }}
                className='w-full rounded-xl'
              >
                Clear All
              </Button>
            </div>
          </div>
        </div>

        {/* Announcements List - iOS Cards */}
        <div className='space-y-3'>
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className='group relative bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden'
            >
              <div className='p-5'>
                <div className='flex items-start justify-between gap-4'>
                  {/* Left Content */}
                  <div className='flex-1 min-w-0'>
                    {/* Title and Status Badge */}
                    <div className='flex items-start gap-3 mb-2'>
                      <h3 className='text-lg font-semibold text-gray-900 leading-tight'>
                        {announcement.title}
                      </h3>
                      <div className='flex gap-2 flex-shrink-0'>
                        <Badge
                          className={`${getStatusColor(announcement.status)} rounded-full px-2.5 py-0.5 text-xs font-medium`}
                        >
                          {announcement.status === "published"
                            ? "✓ Live"
                            : "📝 Draft"}
                        </Badge>
                      </div>
                    </div>

                    {/* Meta Information */}
                    <div className='flex flex-wrap items-center gap-3 mb-3 text-xs text-gray-600'>
                      <span className='flex items-center gap-1'>
                        📅{" "}
                        {new Date(announcement.publishAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                      {announcement.validUntil && (
                        <span className='flex items-center gap-1'>
                          ⏰ Until{" "}
                          {new Date(announcement.validUntil).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      )}
                      <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium'>
                        👥 {announcement.segment}
                      </span>
                    </div>

                    {/* Priority Badge */}
                    <div className='mb-3 flex items-center gap-2'>
                      <Badge
                        className={`${getPriorityColor(announcement.priority)} rounded-md px-2 py-0.5 text-xs font-semibold`}
                      >
                        {announcement.priority === "high" && "🔴 HIGH"}
                        {announcement.priority === "medium" && "🟡 MEDIUM"}
                        {announcement.priority === "low" && "🟢 LOW"}
                      </Badge>
                    </div>

                    {/* Content Preview */}
                    <p className='text-gray-700 text-sm mb-3 line-clamp-2 leading-relaxed'>
                      {announcement.body}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex gap-1.5 flex-shrink-0'>
                    <button
                      onClick={() => handleToggleStatus(announcement.id)}
                      className='flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 font-medium text-xs transition-all duration-150 border border-gray-200 hover:border-blue-300'
                      title={
                        announcement.status === "published" ? "Unpublish" : "Publish"
                      }
                    >
                      {announcement.status === "published" ? (
                        <EyeSlashIcon className='w-4 h-4' />
                      ) : (
                        <EyeIcon className='w-4 h-4' />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditAnnouncement(announcement)}
                      className='flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs transition-all duration-150 border border-blue-200'
                      title='Edit'
                    >
                      <PencilIcon className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement)}
                      className='flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-600 font-medium text-xs transition-all duration-150 border border-red-200'
                      title='Delete'
                    >
                      <TrashIcon className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAnnouncements.length === 0 && (
          <div className='bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl p-12 text-center'>
            <div className='text-6xl mb-4'>📢</div>
            <p className='text-gray-600 text-lg font-medium mb-2'>
              No announcements found
            </p>
            <p className='text-gray-500 text-sm mb-6'>
              Try adjusting your filters or create a new announcement
            </p>
            <Button
              onClick={handleCreateAnnouncement}
              className='bg-primary to-indigo-600'
            >
              <PlusIcon className='w-4 h-4 mr-2' />
              Create First Announcement
            </Button>
          </div>
        )}

        {/* Create/Edit Modal - iOS Style */}
        <Modal
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          title={
            editingAnnouncement ? "Edit Announcement" : "Create New Announcement"
          }
          big={true}
        >
          <div className='space-y-5'>
            <div>
              <label className='block text-sm font-bold text-gray-800 mb-2'>
                Announcement Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder='Enter an engaging title...'
                className='rounded-xl border-gray-300 focus:border-primary focus:ring-primary'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-bold text-gray-800 mb-2'>
                  Target Segment *
                </label>
                <select
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white transition-all'
                  value={formData.segment}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, segment: e.target.value }))
                  }
                >
                  <option value=''>Select segment</option>
                  {segmentOptions.map((segment) => (
                    <option key={segment} value={segment}>
                      {segment}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-bold text-gray-800 mb-2'>
                  Priority Level
                </label>
                <select
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white transition-all'
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: e.target.value as "high" | "medium" | "low",
                    }))
                  }
                >
                  <option value='low'>🟢 Low</option>
                  <option value='medium'>🟡 Medium</option>
                  <option value='high'>🔴 High</option>
                </select>
              </div>
            </div>

            <div>
              <label className='block text-sm font-bold text-gray-800 mb-2'>
                Announcement Message *
              </label>
              <textarea
                className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-vertical font-medium'
                value={formData.body}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, body: e.target.value }))
                }
                placeholder='Write your announcement message here...'
                rows={6}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-bold text-gray-800 mb-2'>
                  Publish Date
                </label>
                <input
                  type='date'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white transition-all'
                  value={formData.publishAt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, publishAt: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className='block text-sm font-bold text-gray-800 mb-2'>
                  Valid Until (Optional)
                </label>
                <input
                  type='date'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white transition-all'
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, validUntil: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-bold text-gray-800 mb-2'>
                Status
              </label>
              <select
                className='w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white transition-all'
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as "draft" | "published",
                  }))
                }
              >
                <option value='draft'>📝 Save as Draft</option>
                <option value='published'>✓ Publish Immediately</option>
              </select>
            </div>

            <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
              <Button
                variant='outline'
                onClick={() => setIsDialogOpen(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className='px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAnnouncement}
                disabled={createMutation.isPending || updateMutation.isPending}
                className='px-6 bg-primary to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "⏳ Saving..."
                  : editingAnnouncement
                    ? "✓ Update"
                    : "✓ Create"}{" "}
                Announcement
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal - iOS Style */}
        <Modal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, announcement: null })}
          title='Delete Announcement'
        >
          <div className='space-y-4'>
            <p className='text-gray-700 font-medium text-base'>
              Are you sure you want to delete{" "}
              <span className='font-bold'>
                "{deleteConfirm.announcement?.title}"
              </span>
              ?
            </p>
            <p className='text-gray-500 text-sm'>This action cannot be undone.</p>
            <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
              <Button
                variant='outline'
                onClick={() =>
                  setDeleteConfirm({ isOpen: false, announcement: null })
                }
                disabled={deleteMutation.isPending}
                className='px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className='px-6 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {deleteMutation.isPending ? "⏳ Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Announcement;
