import React from "react";
import { Award, Download } from "lucide-react";
import { IMyCertificate } from "@/services/certificates.service";

interface MyCertificatesListProps {
  certificates: IMyCertificate[];
  isLoading: boolean;
}

export const MyCertificatesList: React.FC<MyCertificatesListProps> = ({
  certificates,
  isLoading,
}) => {
  const recent = certificates.slice(0, 4);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 h-fit">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#EBF0F9] flex items-center justify-center">
          <Award size={15} className="text-[#3363AD]" />
        </div>
        <h3 className="text-sm font-semibold text-gray-800">My Certificates</h3>
        {certificates.length > 0 && (
          <span className="ml-auto text-xs bg-[#EBF0F9] text-[#3363AD] font-semibold px-2 py-0.5 rounded-full">
            {certificates.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EBF0F9] flex items-center justify-center mb-3">
            <Award size={24} className="text-[#3363AD]/40" />
          </div>
          <p className="text-sm font-medium text-gray-500">No certificates yet</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Complete a course to earn<br />your first certificate
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((cert) => {
            const raw = cert.completedAtRaw ?? cert.completedAt;
            const d = raw ? new Date(raw) : null;
            const dateStr =
              d && !isNaN(d.getTime())
                ? d.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "—";

            return (
              <div
                key={cert.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#EBF0F9] border border-[#3363AD]/10"
              >
                {/* Icon */}
                <div className="shrink-0 w-9 h-9 rounded-lg bg-[#3363AD] flex items-center justify-center">
                  <Award size={16} className="text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {cert.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{dateStr}</p>
                </div>

                {/* Download */}
                <a
                  href={cert.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                    bg-white border border-[#3363AD]/20 text-xs font-medium text-[#3363AD]
                    hover:bg-[#3363AD] hover:text-white transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={12} />
                  PDF
                </a>
              </div>
            );
          })}

          {certificates.length > 4 && (
            <p className="text-center text-xs text-gray-400 pt-1">
              +{certificates.length - 4} more certificates
            </p>
          )}
        </div>
      )}
    </div>
  );
};
