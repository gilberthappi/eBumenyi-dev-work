import React, { useState, useMemo } from "react";
import {
  Award,
  Download,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Users,
  Settings,
  Archive,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/form/Button";
import { IWorkshopCertificate } from "@/types/certificates.d";
import { formatDate } from "@/utils/formats/formats";
import CertificateEditor from "./CertificateEditor";

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
      backgroundImage: "https://via.placeholder.com/800x600",
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
      seals: ["https://via.placeholder.com/80"],
      signatures: [
        {
          name: "Dr. James Smith",
          title: "Workshop Director",
          imageUrl: "",
        },
      ],
    },
    participants: [
      {
        userId: "p-001",
        participantName: "John Patient",
        email: "john@hospital.com",
        status: "issued",
        certificateNumber: "WORKSHOP-2024-001",
        certificateUrl: "https://certificates.chw.com/cert-001.pdf",
        completionDate: "2024-07-15",
      },
      {
        userId: "p-002",
        participantName: "Jane Nurse",
        email: "jane@hospital.com",
        status: "issued",
        certificateNumber: "WORKSHOP-2024-002",
        certificateUrl: "https://certificates.chw.com/cert-002.pdf",
        completionDate: "2024-07-15",
      },
    ],
    skillsAcquired: ["Surgical Techniques", "Patient Care", "Safety Protocols"],
    isPublic: true,
  },
  {
    id: "workshop-002",
    workshopId: "ws-002",
    workshopName: "Healthcare Communication Skills",
    duration: "2 days",
    status: "active",
    createdBy: "trainer-002",
    createdAt: "2024-08-15",
    updatedAt: "2024-08-20",
    template: {
      title: "Completion Certificate",
      description: "Successfully completed healthcare communication training",
      backgroundImage: "https://via.placeholder.com/800x600",
      customDesign: {
        layout: "modern",
        colors: {
          primary: "#f59e0b",
          secondary: "#b45309",
          text: "#1f2937",
        },
        fonts: {
          title: "Verdana",
          body: "Helvetica",
        },
      },
      seals: ["https://via.placeholder.com/80"],
      signatures: [
        {
          name: "Dr. Emily Watson",
          title: "Training Coordinator",
          imageUrl: "",
        },
      ],
    },
    participants: [
      {
        userId: "p-003",
        participantName: "Michael Doctor",
        email: "michael@hospital.com",
        status: "issued",
        certificateNumber: "WORKSHOP-2024-003",
        certificateUrl: "https://certificates.chw.com/cert-003.pdf",
        completionDate: "2024-08-20",
      },
      {
        userId: "p-004",
        participantName: "Sarah Staff",
        email: "sarah@hospital.com",
        status: "pending",
        certificateNumber: "WORKSHOP-2024-004",
        certificateUrl: "",
        completionDate: "",
      },
    ],
    skillsAcquired: ["Communication", "Empathy", "Patient Interaction"],
    isPublic: false,
  },
  {
    id: "workshop-003",
    workshopId: "ws-003",
    workshopName: "Infection Control & Prevention",
    duration: "1 day",
    status: "draft",
    createdBy: "trainer-003",
    createdAt: "2024-09-01",
    updatedAt: "2024-09-05",
    template: {
      title: "Training Certificate",
      description: "Infection Control & Prevention Training",
      backgroundImage: "https://via.placeholder.com/800x600",
      customDesign: {
        layout: "classic",
        colors: {
          primary: "#0284c7",
          secondary: "#075985",
          text: "#1f2937",
        },
        fonts: {
          title: "Times New Roman",
          body: "Calibri",
        },
      },
      seals: ["https://via.placeholder.com/80"],
      signatures: [
        {
          name: "Dr. Robert Health",
          title: "Infection Control Officer",
          imageUrl: "",
        },
      ],
    },
    participants: [],
    skillsAcquired: ["Infection Control", "Safety", "PPE", "Hygiene"],
    isPublic: true,
  },
  {
    id: "workshop-004",
    workshopId: "ws-004",
    workshopName: "Emergency Response Training",
    duration: "2 days",
    status: "active",
    createdBy: "trainer-004",
    createdAt: "2024-09-05",
    updatedAt: "2024-09-10",
    template: {
      title: "Emergency Responder Certificate",
      description: "Certified Emergency Response Training",
      backgroundImage: "https://via.placeholder.com/800x600",
      customDesign: {
        layout: "standard",
        colors: {
          primary: "#dc2626",
          secondary: "#7f1d1d",
          text: "#1f2937",
        },
        fonts: {
          title: "Impact",
          body: "Arial",
        },
      },
      seals: ["https://via.placeholder.com/80"],
      signatures: [
        {
          name: "Chief William Emergency",
          title: "Emergency Coordinator",
          imageUrl: "",
        },
      ],
    },
    participants: [
      {
        userId: "p-005",
        participantName: "Alex Responder",
        email: "alex@hospital.com",
        status: "issued",
        certificateNumber: "WORKSHOP-2024-005",
        certificateUrl: "https://certificates.chw.com/cert-005.pdf",
        completionDate: "2024-09-10",
      },
      {
        userId: "p-006",
        participantName: "Chris Paramedic",
        email: "chris@hospital.com",
        status: "issued",
        certificateNumber: "WORKSHOP-2024-006",
        certificateUrl: "https://certificates.chw.com/cert-006.pdf",
        completionDate: "2024-09-10",
      },
      {
        userId: "p-007",
        participantName: "Dana Medic",
        email: "dana@hospital.com",
        status: "revoked",
        certificateNumber: "WORKSHOP-2024-007",
        certificateUrl: "",
        completionDate: "",
      },
    ],
    skillsAcquired: ["Emergency Response", "Crisis Management", "First Aid"],
    isPublic: true,
  },
];

const Certificates: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCertificate, setSelectedCertificate] =
    useState<IWorkshopCertificate | null>(null);
  const [activeTab, setActiveTab] = useState<"view" | "create" | "manage">("view");

  const itemsPerPage = 10;

  // Filter certificates
  const filteredCertificates = useMemo(() => {
    return MOCK_WORKSHOP_CERTIFICATES.filter((cert) => {
      const matchesSearch = cert.workshopName
        .toLowerCase()
        .includes(searchKeyword.toLowerCase());
      const matchesStatus =
        filterStatus === "active"
          ? cert.status === "active"
          : filterStatus === "all"
          ? true
          : cert.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [searchKeyword, filterStatus]);

  const certificates = filteredCertificates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalCertificates = filteredCertificates.length;
  const totalPages = Math.ceil(totalCertificates / itemsPerPage);

  const [editingCertificate, setEditingCertificate] = useState<IWorkshopCertificate | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleCreateNew = () => {
    setEditingCertificate(null);
    setShowEditor(true);
  };

  const handleEditCertificate = (cert: IWorkshopCertificate) => {
    setEditingCertificate(cert);
    setShowEditor(true);
  };

  const handleSaveCertificate = (_cert: IWorkshopCertificate) => {
    setShowEditor(false);
    toast.success("Certificate saved successfully");
  };

  // Handle delete (mock)
  const handleDelete = (id: string) => {
    void id; // Suppress unused parameter warning
    if (window.confirm("Are you sure you want to delete this certificate?")) {
      toast.success("Certificate deleted successfully");
    }
  };

  // Handle archive (mock)
  const handleArchive = (id: string) => {
    void id; // Suppress unused parameter warning
    if (window.confirm("Are you sure you want to archive this certificate?")) {
      toast.success("Certificate archived successfully");
    }
  };

  // Handle download (mock)
  const handleDownload = async (cert: IWorkshopCertificate) => {
    try {
      // Mock PDF generation
      const pdfContent = `Certificate Template\n\n${cert.workshopName}\n\nCreated: ${cert.createdAt}`;
      const blob = new Blob([pdfContent], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${cert.workshopName}-template.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Certificate template downloaded successfully");
    } catch (error) {
      toast.error("Failed to download certificate");
      console.error(error);
    }
  };

  // Stats
  const activeCertificates = MOCK_WORKSHOP_CERTIFICATES.filter((c) => c.status === "active").length;
  const draftCertificates = MOCK_WORKSHOP_CERTIFICATES.filter((c) => c.status === "draft").length;
  const totalIssuedCertificates = MOCK_WORKSHOP_CERTIFICATES.reduce(
    (sum, c) => sum + (c.participants?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificates</h1>
        <p className="text-gray-600">Create, manage, and track workshop certificates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{totalCertificates}</p>
            </div>
            <Award className="w-8 h-8 text-blue-500 opacity-30" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeCertificates}</p>
            </div>
            <Eye className="w-8 h-8 text-green-500 opacity-30" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Drafts</p>
              <p className="text-2xl font-bold text-yellow-600">{draftCertificates}</p>
            </div>
            <Settings className="w-8 h-8 text-yellow-500 opacity-30" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Issued</p>
              <p className="text-2xl font-bold text-purple-600">
                {totalIssuedCertificates}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500 opacity-30" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("view")}
            className={`px-6 py-3 font-medium ${
              activeTab === "view"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            View Certificates
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-3 font-medium ${
              activeTab === "create"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create New
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-3 font-medium ${
              activeTab === "manage"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Manage
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "view" && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-700 mb-4">
                  <Filter className="w-5 h-5" />
                  <span className="font-medium">Filters</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Certificates
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by workshop name"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setSearchKeyword(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setFilterStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Certificates</option>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificates Table */}
            {certificates.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg shadow">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No certificates found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Create a new certificate to get started
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Workshop Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Participants
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {cert.workshopName}
                          </p>
                          <p className="text-sm text-gray-500">{cert.duration}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              cert.status === "active"
                                ? "bg-green-100 text-green-800"
                                : cert.status === "draft"
                                ? "bg-yellow-100 text-yellow-800"
                                : cert.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {cert.participants?.length || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(cert.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedCertificate(cert)}
                              className="p-2 hover:bg-blue-50 rounded text-blue-600"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(cert)}
                              className="p-2 hover:bg-green-50 rounded text-green-600"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditCertificate(cert)}
                              className="p-2 hover:bg-purple-50 rounded text-purple-600"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleArchive(cert.id)}
                              className="p-2 hover:bg-orange-50 rounded text-orange-600"
                              title="Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cert.id)}
                              className="p-2 hover:bg-red-50 rounded text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 p-6 border-t">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "create" && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Create New Certificate</p>
              <p className="text-gray-500 text-sm mb-6">
                Start building your custom certificate template
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create Certificate
              </Button>
            </div>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Manage Certificates</p>
              <p className="text-gray-500 text-sm">
                View and manage all your certificates from the View tab
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Detail Modal */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCertificate(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{selectedCertificate.workshopName}</h2>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="text-2xl leading-none hover:opacity-75"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className="text-sm font-medium capitalize">
                    {selectedCertificate.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Duration</p>
                  <p className="text-sm font-medium">
                    {selectedCertificate.duration}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Participants</p>
                  <p className="text-sm font-medium">
                    {selectedCertificate.participants?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Visibility</p>
                  <p className="text-sm font-medium">
                    {selectedCertificate.isPublic ? "Public" : "Private"}
                  </p>
                </div>
              </div>

              {/* Template Info */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Certificate Template</p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-900">
                    {selectedCertificate.template.title}
                  </p>
                  {selectedCertificate.template.description && (
                    <p className="text-sm text-gray-600">
                      {selectedCertificate.template.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills */}
              {selectedCertificate.skillsAcquired.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Skills Acquired</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCertificate.skillsAcquired.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants */}
              {selectedCertificate.participants &&
                selectedCertificate.participants.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500 mb-2">
                      Issued To ({selectedCertificate.participants.length})
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedCertificate.participants.map((participant, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {participant.participantName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {participant.email}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              participant.status === "issued"
                                ? "bg-green-100 text-green-800"
                                : participant.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {participant.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="border-t pt-4 flex gap-3">
                <Button
                  onClick={() => handleDownload(selectedCertificate)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                <Button
                  onClick={() => setSelectedCertificate(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Editor Modal */}
      {showEditor && (
        <CertificateEditor
          certificate={editingCertificate || undefined}
          onSave={handleSaveCertificate}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
};

export default Certificates;
