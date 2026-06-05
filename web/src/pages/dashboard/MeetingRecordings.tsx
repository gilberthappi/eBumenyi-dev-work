import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EyeIcon, EyeSlashIcon, TrashIcon, PlayIcon, ArrowLeftIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  getAllRecordings,
  publishRecording,
  unpublishRecording,
  deleteRecording,
  buildRecordingUrl,
  getTrainees,
  type IMeetingRecording,
  type RecordingAudience,
  type ITraineeOption,
} from '@/services/recording.service';
import { getEventById } from '@/services/calender.service';
import { formatDate } from '@/utils/formats/formats';

// ── Publish audience modal ─────────────────────────────────────────────────

interface PublishModalProps {
  recording: IMeetingRecording;
  onClose: () => void;
  onConfirm: (publishedTo: RecordingAudience, invitedUserIds: string[]) => void;
  isPending: boolean;
}

const AUDIENCE_OPTIONS: { value: RecordingAudience; label: string; description: string }[] = [
  { value: 'ALL', label: 'All users', description: 'Everyone in the system can watch this recording' },
  { value: 'TRAINEES', label: 'All CHWs', description: 'Only community health workers (trainees) can watch' },
  { value: 'INVITED', label: 'Invited users only', description: 'Only specific people you choose can watch' },
];

const PublishModal: React.FC<PublishModalProps> = ({ recording, onClose, onConfirm, isPending }) => {
  const [audience, setAudience] = useState<RecordingAudience>('ALL');
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<ITraineeOption[]>([]);

  const hasEventId = !!recording.eventId;

  // When linked to an event, fetch that event's participants instead of all trainees
  const { data: eventData, isLoading: loadingEvent } = useQuery({
    queryKey: ['event-participants', recording.eventId],
    queryFn: () => getEventById(recording.eventId!),
    enabled: audience === 'INVITED' && hasEventId,
    staleTime: 30_000,
  });

  // Fallback: all trainees (only used when recording has no linked event)
  const { data: trainees = [], isLoading: loadingTrainees } = useQuery({
    queryKey: ['trainees', search],
    queryFn: () => getTrainees(search || undefined),
    enabled: audience === 'INVITED' && !hasEventId,
    staleTime: 30_000,
  });

  const eventInvitees: ITraineeOption[] = (eventData?.data?.participants ?? []).map((p) => ({
    id: p.userId,
    fullNames: p.user.fullNames,
    email: p.user.email,
    photo: '',
  }));

  const allCandidates = hasEventId ? eventInvitees : trainees;

  const filteredTrainees = allCandidates
    .filter((t) => !selectedUsers.some((s) => s.id === t.id))
    .filter((t) =>
      !hasEventId || !search
        ? true
        : t.fullNames.toLowerCase().includes(search.toLowerCase()) ||
          (t.email ?? '').toLowerCase().includes(search.toLowerCase()),
    );

  const loadingCandidates = hasEventId ? loadingEvent : loadingTrainees;

  const toggleUser = (user: ITraineeOption) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const handleConfirm = () => {
    if (audience === 'INVITED' && selectedUsers.length === 0) {
      toast.error('Select at least one user to invite');
      return;
    }
    onConfirm(audience, selectedUsers.map((u) => u.id));
  };

  const title = recording.title ?? recording.event?.title ?? 'this recording';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Publish recording</h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Audience picker */}
        <div className="p-5 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Who can watch this recording?</p>
          {AUDIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAudience(opt.value)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                audience === opt.value
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 transition-colors ${
                  audience === opt.value
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}
              />
              <div>
                <p className={`text-sm font-medium ${audience === opt.value ? 'text-primary' : 'text-gray-800'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Invited user picker */}
        {audience === 'INVITED' && (
          <div className="px-5 pb-4 space-y-3 border-t border-gray-50 pt-4">
            {/* Selected chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {u.fullNames}
                    <button onClick={() => toggleUser(u)} className="hover:text-red-500">
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={hasEventId ? 'Search invited users...' : 'Search trainees...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* User list */}
            <div className="max-h-44 overflow-y-auto space-y-1 rounded-lg border border-gray-100">
              {loadingCandidates ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredTrainees.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  {hasEventId ? 'No invited users found' : 'No trainees found'}
                </p>
              ) : (
                filteredTrainees.map((trainee) => (
                  <button
                    key={trainee.id}
                    onClick={() => toggleUser(trainee)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    {trainee.photo ? (
                      <img src={trainee.photo} alt={trainee.fullNames} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{trainee.fullNames}</p>
                      {trainee.email && <p className="text-xs text-gray-400 truncate">{trainee.email}</p>}
                    </div>
                    {selectedUsers.some((u) => u.id === trainee.id) && (
                      <CheckCircleIcon className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 justify-end p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#4d81d2] disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const AUDIENCE_LABELS: Record<RecordingAudience, string> = {
  ALL: 'All users',
  TRAINEES: 'All CHWs',
  INVITED: 'Invited',
};

const MeetingRecordings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<IMeetingRecording | null>(null);
  const [previewRecording, setPreviewRecording] = useState<IMeetingRecording | null>(null);
  const [publishTarget, setPublishTarget] = useState<IMeetingRecording | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['recordings-admin'],
    queryFn: async () => {
      const res = await getAllRecordings();
      return res.data ?? [];
    },
  });

  const recordings: IMeetingRecording[] = data ?? [];

  const publishMutation = useMutation({
    mutationFn: ({
      id,
      publishedTo,
      invitedUserIds,
    }: {
      id: string;
      publishedTo: RecordingAudience;
      invitedUserIds: string[];
    }) => publishRecording(id, publishedTo, invitedUserIds),
    onSuccess: () => {
      toast.success('Recording published');
      queryClient.invalidateQueries({ queryKey: ['recordings-admin'] });
      setPublishTarget(null);
    },
    onError: () => toast.error('Failed to publish recording'),
  });

  const unpublishMutation = useMutation({
    mutationFn: unpublishRecording,
    onSuccess: () => {
      toast.success('Recording unpublished');
      queryClient.invalidateQueries({ queryKey: ['recordings-admin'] });
    },
    onError: () => toast.error('Failed to unpublish recording'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecording,
    onSuccess: () => {
      toast.success('Recording deleted');
      queryClient.invalidateQueries({ queryKey: ['recordings-admin'] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete recording'),
  });

  const filtered = recordings.filter((r) => {
    const matchesSearch =
      (r.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.event?.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.user?.fullNames ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && r.isPublished) ||
      (statusFilter === 'draft' && !r.isPublished);
    return matchesSearch && matchesStatus;
  });

  const formatRecordingDate = (dateStr: string) => formatDate(dateStr);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/calender')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meeting Recordings</h1>
            <p className="text-sm text-gray-500 hidden sm:block">Publish recordings to make them available for trainees</p>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-gray-500 flex-shrink-0 mt-1">
          {recordings.filter((r) => r.isPublished).length}/{recordings.length} published
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by title, meeting, or uploader..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[180px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <PlayIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No recordings found</p>
            <p className="text-sm">Recordings will appear here once meetings are completed</p>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filtered.map((recording) => (
                <div key={recording.id} className="p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PlayIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {recording.title ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {recording.event?.description ?? '—'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        recording.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {recording.isPublished ? 'Published' : 'Draft'}
                      </span>
                      {recording.isPublished && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                          {AUDIENCE_LABELS[recording.publishedTo ?? 'ALL']}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pl-12">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {recording.user?.photo && (
                          <img src={recording.user.photo} alt={recording.user.fullNames} className="w-5 h-5 rounded-full object-cover" />
                        )}
                        <span className="text-xs text-gray-500">{recording.user?.fullNames ?? '—'}</span>
                      </div>
                      <p className="text-xs text-gray-400">{formatRecordingDate(recording.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewRecording(recording)}
                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <PlayIcon className="w-4 h-4" />
                      </button>
                      {recording.isPublished ? (
                        <button
                          onClick={() => unpublishMutation.mutate(recording.id)}
                          disabled={unpublishMutation.isPending}
                          className="p-1.5 text-green-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <EyeSlashIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setPublishTarget(recording)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(recording)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <table className="hidden sm:table w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">About</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded by</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((recording) => (
                  <tr key={recording.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <PlayIcon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 line-clamp-1">
                          {recording.title ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 line-clamp-2">{recording.event?.description ?? '—'}</div>
                      {recording.event?.startAt && (
                        <div className="text-xs text-gray-400 mt-0.5">{formatRecordingDate(recording.event.startAt)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {recording.user?.photo && (
                          <img
                            src={recording.user.photo}
                            alt={recording.user.fullNames}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        )}
                        <span className="text-sm text-gray-700">{recording.user?.fullNames ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatRecordingDate(recording.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            recording.isPublished
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {recording.isPublished ? 'Published' : 'Draft'}
                        </span>
                        {recording.isPublished && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                            {AUDIENCE_LABELS[recording.publishedTo ?? 'ALL']}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewRecording(recording)}
                          title="Preview"
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <PlayIcon className="w-4 h-4" />
                        </button>
                        {recording.isPublished ? (
                          <button
                            onClick={() => unpublishMutation.mutate(recording.id)}
                            disabled={unpublishMutation.isPending}
                            title="Unpublish"
                            className="p-1.5 text-green-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <EyeSlashIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setPublishTarget(recording)}
                            title="Publish"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(recording)}
                          title="Delete"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {previewRecording.title ?? previewRecording.event?.title ?? 'Recording Preview'}
              </h3>
              <button
                onClick={() => setPreviewRecording(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black">
              <video
                src={buildRecordingUrl(previewRecording.url)}
                controls
                autoPlay
                className="w-full max-h-[60vh]"
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {previewRecording.event?.title ?? 'No meeting linked'} • {formatRecordingDate(previewRecording.createdAt)}
              </span>
              <a
                href={buildRecordingUrl(previewRecording.url)}
                download
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#4d81d2] transition-colors"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Publish audience modal */}
      {publishTarget && (
        <PublishModal
          recording={publishTarget}
          onClose={() => setPublishTarget(null)}
          onConfirm={(publishedTo, invitedUserIds) =>
            publishMutation.mutate({ id: publishTarget.id, publishedTo, invitedUserIds })
          }
          isPending={publishMutation.isPending}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Recording?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete the recording file and cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRecordings;
