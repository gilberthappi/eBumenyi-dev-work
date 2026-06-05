import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Download,
  Edit,
  Trash2,
  Search,
  Filter,
  Users,
  Archive,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import type { IWorkshopCertificate } from "@/types/certificates.d";
import { formatDate } from "@/utils/formats/formats";

// Mock data
const MOCK_WORKSHOP_CERTIFICATES: IWorkshopCertificate[] = [
  {
    id: "workshop-001",
    workshopId: "ws-001",
    workshopName: "Advanced Surgical Techniques",
    duration: "3 days",
    status: "active",
    createdBy: "trainer-001",
    createdAt: "2024-07-10",
    updatedAt: "2024-07-15",
    template: {
      title: "Certificate of Participation",
      description: "Successfully completed the workshop",
      customDesign: {
        layout: "standard",
        colors: {
          primary: "#3b82f6",
          secondary: "#1e40af",
          text: "#1f2937",
        },
        fonts: {
          title: "Georgia",
          body: "Arial",
        },
      },
      signatures: [
        {
          name: "Dr. Sarah Johnson",
          title: "Workshop Lead",
        },
      ],
    },
    participants: [
      {
        userId: "user-001",
        participantName: "Ahmed Hassan",
        email: "ahmed@example.com",
        status: "issued",
        certificateUrl: "https://example.com/cert-001",
        completionDate: "2024-07-13",
        certificateNumber: "CERT-2024-001",
      },
      {
        userId: "user-002",
        participantName: "Fatima Al-Mansouri",
        email: "fatima@example.com",
        status: "issued",
        certificateUrl: "https://example.com/cert-002",
        completionDate: "2024-07-13",
        certificateNumber: "CERT-2024-002",
      },
    ],
    skillsAcquired: ["Surgical skills", "Patient care", "Emergency response"],
    isPublic: true,
  },
  {
    id: "workshop-002",
    workshopId: "ws-002",
    workshopName: "Healthcare Management",
    duration: "5 days",
    status: "draft",
    createdBy: "trainer-002",
    createdAt: "2024-08-01",
    updatedAt: "2024-08-05",
    template: {
      title: "Certificate of Achievement",
      description: "For successful completion of the healthcare management program",
      customDesign: {
        layout: "modern",
        colors: {
          primary: "#10b981",
          secondary: "#059669",
          text: "#111827",
        },
        fonts: {
          title: "Verdana",
          body: "Calibri",
        },
      },
      signatures: [
        {
          name: "Prof. Mohammed Al-Khaled",
          title: "Program Director",
        },
      ],
    },
    participants: [
      {
        userId: "user-003",
        participantName: "Zainab Saleh",
        email: "zainab@example.com",
        status: "pending",
        certificateUrl: "",
        completionDate: "",
        certificateNumber: "",
      },
    ],
    skillsAcquired: ["Management", "Leadership", "Communication"],
    isPublic: false,
  },
  {
    id: "workshop-003",
    workshopId: "ws-003",
    workshopName: "Infection Prevention",
    duration: "2 days",
    status: "completed",
    createdBy: "trainer-001",
    createdAt: "2024-06-15",
    updatedAt: "2024-06-17",
    template: {
      title: "Certificate of Completion",
      description: "Infection prevention and control training",
      customDesign: {
        layout: "classic",
        colors: {
          primary: "#f59e0b",
          secondary: "#d97706",
          text: "#1f2937",
        },
        fonts: {
          title: "Times",
          body: "Arial",
        },
      },
      signatures: [
        {
          name: "Dr. Amira Hassan",
          title: "Infection Control Officer",
        },
        {
          name: "Mr. Karim Saleh",
          title: "Hospital Administrator",
        },
      ],
    },
    participants: [
      {
        userId: "user-004",
        participantName: "Hana Omar",
        email: "hana@example.com",
        status: "issued",
        certificateUrl: "https://example.com/cert-003",
        completionDate: "2024-06-17",
        certificateNumber: "CERT-2024-003",
      },
      {
        userId: "user-005",
        participantName: "Youssef Ibrahim",
        email: "youssef@example.com",
        status: "issued",
        certificateUrl: "https://example.com/cert-004",
        completionDate: "2024-06-17",
        certificateNumber: "CERT-2024-004",
      },
      {
        userId: "user-006",
        participantName: "Noor Malik",
        email: "noor@example.com",
        status: "revoked",
        certificateUrl: "",
        completionDate: "",
        certificateNumber: "",
      },
    ],
    skillsAcquired: ["Infection control", "Hygiene", "Safety protocols"],
    isPublic: true,
  },
  {
    id: "workshop-004",
    workshopId: "ws-004",
    workshopName: "Patient Communication",
    duration: "1 day",
    status: "archived",
    createdBy: "trainer-003",
    createdAt: "2024-05-20",
    updatedAt: "2024-05-21",
    template: {
      title: "Certificate of Participation",
      description: "Patient communication workshop",
      customDesign: {
        layout: "standard",
        colors: {
          primary: "#ec4899",
          secondary: "#be185d",
          text: "#1f2937",
        },
        fonts: {
          title: "Impact",
          body: "Tahoma",
        },
      },
      signatures: [
        {
          name: "Ms. Layla Ahmed",
          title: "Communication Specialist",
        },
      ],
    },
    participants: [],
    skillsAcquired: ["Communication", "Patient empathy", "Listening skills"],
    isPublic: false,
  },
];

export default function CertificatesManagement() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState(MOCK_WORKSHOP_CERTIFICATES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Filter certificates
  const filtered = useMemo(() => {
    return certificates.filter((cert) => {
      const matchesSearch = cert.workshopName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || cert.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [certificates, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedCerts = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    total: certificates.length,
    active: certificates.filter((c) => c.status === "active").length,
    draft: certificates.filter((c) => c.status === "draft").length,
    issued: certificates.reduce(
      (sum, c) =>
        sum + c.participants.filter((p) => p.status === "issued").length,
      0
    ),
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this certificate?")) {
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      toast.success("Certificate deleted");
    }
  };

  const handleArchive = (id: string) => {
    setCertificates((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "archived" as const } : c
      )
    );
    toast.success("Certificate archived");
  };

  const handleDownload = (id: string) => {
    const cert = certificates.find((c) => c.id === id);
    if (!cert) return;

    const blob = new Blob([`Certificate: ${cert.workshopName}`], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cert.workshopName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Certificate downloaded");
  };

  const statusColorMap: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    draft: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
    archived: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
          <Award className="w-8 h-8 text-blue-600" />
          Certificate Management
        </h1>
        <p className="text-gray-600">
          Create, manage, and distribute certificates for your workshops
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold mb-2">
            Total Certificates
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold mb-2">Active</div>
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold mb-2">Draft</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.draft}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-600 text-sm font-semibold mb-2">Issued</div>
          <div className="text-3xl font-bold text-blue-600">{stats.issued}</div>
        </div>
      </div>

      {/* Create Button & Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <button
          onClick={() => navigate("/certificates/design")}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Create New Certificate
        </button>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Workshop Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Participants
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Created
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedCerts.length > 0 ? (
              paginatedCerts.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {cert.workshopName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {cert.template.title}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        statusColorMap[cert.status] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users className="w-4 h-4" />
                      <span>{cert.participants.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(cert.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/certificates/design/${cert.id}`)}
                        className="p-2 hover:bg-blue-100 rounded text-blue-600 transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(cert.id)}
                        className="p-2 hover:bg-green-100 rounded text-green-600 transition"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(cert.id)}
                        className="p-2 hover:bg-yellow-100 rounded text-yellow-600 transition"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cert.id)}
                        className="p-2 hover:bg-red-100 rounded text-red-600 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                  <Award className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No certificates found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {paginatedCerts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
              {Math.min(currentPage * itemsPerPage, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
