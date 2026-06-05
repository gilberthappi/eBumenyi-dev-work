import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlayIcon, ArrowDownTrayIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import {
  getPublishedRecordings,
  buildRecordingUrl,
  type IMeetingRecording,
} from '@/services/recording.service';
import { formatDate as formatDateUtil } from '@/utils/formats/formats';

const WatchRecordings: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRecording, setActiveRecording] = useState<IMeetingRecording | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['recordings-published'],
    queryFn: async () => {
      const res = await getPublishedRecordings();
      return res.data ?? [];
    },
  });

  const recordings: IMeetingRecording[] = data ?? [];

  const filtered = recordings.filter((r) =>
    (r.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.event?.title ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => formatDateUtil(dateStr);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/calender')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recorded Meetings</h1>
          <p className="text-sm text-gray-500">Watch or download published meeting recordings</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search recordings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <PlayIcon className="w-14 h-14 mb-3 opacity-25" />
          <p className="text-lg font-medium text-gray-500">No recordings available</p>
          <p className="text-sm">Check back later for new meeting recordings</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((recording) => (
            <div
              key={recording.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail / Play area */}
              <button
                onClick={() => setActiveRecording(recording)}
                className="w-full aspect-video bg-gray-900 flex items-center justify-center relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform z-10">
                  <PlayIcon className="w-7 h-7 text-primary ml-1" />
                </div>
              </button>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
                  {recording.title ?? recording.event?.title ?? 'Untitled Recording'}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                  {recording.event?.description ?? recording.event?.title ?? 'No description'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {recording.publishedAt
                      ? formatDate(recording.publishedAt)
                      : formatDate(recording.createdAt)}
                  </span>
                  <a
                    href={buildRecordingUrl(recording.url)}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {activeRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {activeRecording.title ?? activeRecording.event?.title ?? 'Untitled Recording'}
                </h3>
                {(activeRecording.event?.description || activeRecording.event?.title) && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {activeRecording.event.description ?? activeRecording.event.title}
                  </p>
                )}
              </div>
              <button
                onClick={() => setActiveRecording(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="bg-black">
              <video
                key={activeRecording.id}
                src={buildRecordingUrl(activeRecording.url)}
                controls
                autoPlay
                className="w-full max-h-[65vh]"
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {activeRecording.publishedAt
                  ? `Published ${formatDate(activeRecording.publishedAt)}`
                  : formatDate(activeRecording.createdAt)}
              </span>
              <a
                href={buildRecordingUrl(activeRecording.url)}
                download
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-[#4d81d2] transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchRecordings;
