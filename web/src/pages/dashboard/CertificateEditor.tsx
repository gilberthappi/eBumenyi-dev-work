import React, { useState } from "react";
import {
  Save,
  X,
  Eye,
  Type,
  Palette,
  Layout,
} from "lucide-react";
import toast from "react-hot-toast";
import { IWorkshopCertificate, CertificateTemplate } from "@/types/certificates.d";

interface CertificateEditorProps {
  certificate?: IWorkshopCertificate;
  onSave?: (certificate: IWorkshopCertificate) => void;
  onClose?: () => void;
}

const DEFAULT_TEMPLATE: CertificateTemplate = {
  title: "Certificate of Completion",
  description: "This is to certify that",
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
      name: "Director",
      title: "Executive Director",
      imageUrl: "",
    },
  ],
};

const CertificateEditor: React.FC<CertificateEditorProps> = ({
  certificate,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<IWorkshopCertificate>(
    certificate || {
      id: `workshop-${Date.now()}`,
      workshopId: `ws-${Date.now()}`,
      workshopName: "",
      createdBy: "current-user",
      duration: "",
      template: DEFAULT_TEMPLATE,
      participants: [],
      skillsAcquired: [],
      status: "draft",
      isPublic: false,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    }
  );

  const [activeTab, setActiveTab] = useState<
    "basic" | "template" | "skills" | "preview"
  >("basic");
  const [previewZoom, setPreviewZoom] = useState(100);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTemplateChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      template: {
        ...prev.template,
        [field]: value,
      },
    }));
  };

  const handleColorChange = (colorType: "primary" | "secondary" | "text", value: string) => {
    setFormData((prev) => ({
      ...prev,
      template: {
        ...prev.template,
        customDesign: {
          ...prev.template.customDesign!,
          colors: {
            ...prev.template.customDesign!.colors,
            [colorType]: value,
          },
        },
      },
    }));
  };

  const handleFontChange = (fontType: "title" | "body", value: string) => {
    setFormData((prev) => ({
      ...prev,
      template: {
        ...prev.template,
        customDesign: {
          ...prev.template.customDesign!,
          fonts: {
            ...prev.template.customDesign!.fonts,
            [fontType]: value,
          },
        },
      },
    }));
  };

  const handleSignatureChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      template: {
        ...prev.template,
        signatures: (prev.template.signatures || []).map((sig, i) =>
          i === index ? { ...sig, [field]: value } : sig
        ),
      },
    }));
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skillsAcquired.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skillsAcquired: [...prev.skillsAcquired, skill],
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skillsAcquired: prev.skillsAcquired.filter((s) => s !== skill),
    }));
  };

  const handleSave = () => {
    if (!formData.workshopName.trim()) {
      toast.error("Workshop name is required");
      return;
    }
    if (!formData.duration.trim()) {
      toast.error("Duration is required");
      return;
    }
    if (onSave) {
      onSave(formData);
      toast.success("Certificate saved successfully");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h1 className="text-2xl font-bold">
              {certificate ? "Edit Certificate" : "Create New Certificate"}
            </h1>
            <button
              onClick={onClose}
              className="text-white hover:opacity-75"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b bg-gray-50">
            {(
              ["basic", "template", "skills", "preview"] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "basic" && (
                  <>
                    <Type className="w-4 h-4 inline mr-2" />
                    Basic Info
                  </>
                )}
                {tab === "template" && (
                  <>
                    <Palette className="w-4 h-4 inline mr-2" />
                    Design
                  </>
                )}
                {tab === "skills" && (
                  <>
                    <Layout className="w-4 h-4 inline mr-2" />
                    Skills
                  </>
                )}
                {tab === "preview" && (
                  <>
                    <Eye className="w-4 h-4 inline mr-2" />
                    Preview
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workshop Name *
                  </label>
                  <input
                    type="text"
                    value={formData.workshopName}
                    onChange={(e) =>
                      handleInputChange("workshopName", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter workshop name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration *
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) =>
                      handleInputChange("duration", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 3 days, 2 weeks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) =>
                        handleInputChange("isPublic", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Make certificate public
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Template Design Tab */}
            {activeTab === "template" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.template.title}
                    onChange={(e) =>
                      handleTemplateChange("title", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.template.description || ""}
                    onChange={(e) =>
                      handleTemplateChange("description", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Certificate description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Layout
                  </label>
                  <select
                    value={formData.template.customDesign?.layout || "standard"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        template: {
                          ...prev.template,
                          customDesign: {
                            ...prev.template.customDesign!,
                            layout: e.target.value as "standard" | "modern" | "classic",
                          },
                        },
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <input
                      type="color"
                      value={formData.template.customDesign?.colors.primary || "#3b82f6"}
                      onChange={(e) =>
                        handleColorChange("primary", e.target.value)
                      }
                      className="w-full h-10 rounded border border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color
                    </label>
                    <input
                      type="color"
                      value={formData.template.customDesign?.colors.secondary || "#1e40af"}
                      onChange={(e) =>
                        handleColorChange("secondary", e.target.value)
                      }
                      className="w-full h-10 rounded border border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={formData.template.customDesign?.colors.text || "#1f2937"}
                      onChange={(e) =>
                        handleColorChange("text", e.target.value)
                      }
                      className="w-full h-10 rounded border border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title Font
                    </label>
                    <select
                      value={formData.template.customDesign?.fonts.title || "Georgia"}
                      onChange={(e) =>
                        handleFontChange("title", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Impact">Impact</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Body Font
                    </label>
                    <select
                      value={formData.template.customDesign?.fonts.body || "Arial"}
                      onChange={(e) =>
                        handleFontChange("body", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Calibri">Calibri</option>
                      <option value="Tahoma">Tahoma</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Signatures
                  </h3>
                  {(formData.template.signatures || []).map((sig, index) => (
                    <div key={index} className="space-y-3 mb-4 p-4 bg-gray-50 rounded">
                      <input
                        type="text"
                        value={sig.name}
                        onChange={(e) =>
                          handleSignatureChange(index, "name", e.target.value)
                        }
                        placeholder="Signatory name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={sig.title}
                        onChange={(e) =>
                          handleSignatureChange(index, "title", e.target.value)
                        }
                        placeholder="Title/Position"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === "skills" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Skills
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="skillInput"
                      placeholder="Enter skill name"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const input = e.currentTarget;
                          addSkill(input.value);
                          input.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById(
                          "skillInput"
                        ) as HTMLInputElement;
                        addSkill(input.value);
                        input.value = "";
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Skills Acquired ({formData.skillsAcquired.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.skillsAcquired.map((skill) => (
                      <div
                        key={skill}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full flex items-center gap-2"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {formData.skillsAcquired.length === 0 && (
                    <p className="text-gray-500 text-sm">
                      No skills added yet. Add skills to showcase what
                      participants will learn.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === "preview" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    Zoom:
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={previewZoom}
                    onChange={(e) => setPreviewZoom(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {previewZoom}%
                  </span>
                </div>

                <div className="flex justify-center bg-gray-100 p-8 rounded-lg overflow-auto">
                  <div
                    style={{
                      transform: `scale(${previewZoom / 100})`,
                      transformOrigin: "top center",
                      width: "8.5in",
                      height: "11in",
                      backgroundColor: "#ffffff",
                      color: formData.template.customDesign?.colors.text || "#1f2937",
                      border: `4px solid ${formData.template.customDesign?.colors.secondary || "#1e40af"}`,
                      padding: "2in",
                      fontFamily: formData.template.customDesign?.fonts.body || "Arial",
                      boxSizing: "border-box",
                    }}
                    className="bg-white shadow-2xl flex flex-col justify-between"
                  >
                    {/* Top Section */}
                    <div>
                      <div
                        style={{
                          color: formData.template.customDesign?.colors.primary || "#3b82f6",
                          fontFamily: formData.template.customDesign?.fonts.title || "Georgia",
                          fontSize: "48px",
                          fontWeight: "bold",
                          marginBottom: "20px",
                          textAlign: "center",
                        }}
                      >
                        {formData.template.title}
                      </div>
                      <div style={{ fontSize: "18px", marginBottom: "30px", textAlign: "center" }}>
                        {formData.template.description}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="my-8">
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "bold",
                          marginBottom: "20px",
                          color: formData.template.customDesign?.colors.primary || "#3b82f6",
                          textAlign: "center",
                        }}
                      >
                        {formData.workshopName}
                      </div>
                      <div style={{ fontSize: "14px", marginBottom: "20px", textAlign: "center" }}>
                        Duration: {formData.duration}
                      </div>
                      {formData.skillsAcquired.length > 0 && (
                        <div style={{ fontSize: "12px", marginBottom: "20px", textAlign: "center" }}>
                          Skills:{" "}
                          {formData.skillsAcquired.slice(0, 3).join(", ")}
                          {formData.skillsAcquired.length > 3 && " ..."}
                        </div>
                      )}
                    </div>

                    {/* Bottom Section */}
                    <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end" }}>
                      {(formData.template.signatures || []).map((sig, index) => (
                        <div key={index} style={{ textAlign: "center" }}>
                          <div
                            style={{ borderTop: "2px solid currentColor", width: "128px", marginBottom: "8px" }}
                          />
                          <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                            {sig.name}
                          </div>
                          <div style={{ fontSize: "10px" }}>{sig.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateEditor;
