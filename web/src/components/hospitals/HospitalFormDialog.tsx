import React, { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/form/Button";
import { IHospital } from "@/types";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHospital, updateHospital } from "@/services/hospitals.service";
import { locations, getDistrictOptions, getSectorOptions, getCellOptions, getVillageOptions } from "@/hooks/locations";

interface HospitalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: IHospital | null;
}

const HospitalFormDialog: React.FC<HospitalFormDialogProps> = ({
  isOpen,
  onClose,
  hospital
}) => {
  const [formData, setFormData] = useState({
    name: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
    contact: "",
    email: "",
    chwSupervisor: "",
    chwSupervisorContact: "",
    catchmentAreaType: "district" as "district" | "sector" | "cell" | "village",
    catchmentArea: [] as string[]
  });

  const [catchmentInput, setCatchmentInput] = useState("");
  const [catchmentDistrict, setCatchmentDistrict] = useState("");
  const [catchmentSector, setCatchmentSector] = useState("");
  const [catchmentCell, setCatchmentCell] = useState("");

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createHospital,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      toast.success("Hospital created successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to create hospital");
      console.error("Create hospital error:", error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IHospital> }) =>
      updateHospital(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals"] });
      toast.success("Hospital updated successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update hospital");
      console.error("Update hospital error:", error);
    }
  });

  // Reset form when dialog opens/closes or hospital changes
  useEffect(() => {
    if (isOpen) {
      if (hospital) {
        // Edit mode - populate form with existing data
        // Parse location string: "village, cell, sector, district, province"
        setFormData({
          name: hospital.name,
          province: hospital.province|| "",
          district: hospital.district || "",
          sector: hospital.sector || "",
          cell: hospital.cell || "",
          village: hospital.village || "",
          contact: hospital.contact || "",
          email: hospital.email || "",
          chwSupervisor: hospital.chwSupervisor || "",
          chwSupervisorContact: hospital.chwSupervisorContact || "",
          catchmentAreaType: "district",
          catchmentArea: hospital.catchmentArea || []
        });
      } else {
        // Create mode - reset form
        setFormData({
          name: "",
          province: "",
          district: "",
          sector: "",
          cell: "",
          village: "",
          contact: "",
          email: "",
          chwSupervisor: "",
          chwSupervisorContact: "",
          catchmentAreaType: "district",
          catchmentArea: []
        });
      }
      setCatchmentInput("");
      setCatchmentDistrict("");
      setCatchmentSector("");
      setCatchmentCell("");
    }
  }, [isOpen, hospital]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset dependent fields when parent changes
    if (name === 'province') {
      setFormData(prev => ({
        ...prev,
        district: "",
        sector: "",
        cell: "",
        village: ""
      }));
    } else if (name === 'district') {
      setFormData(prev => ({
        ...prev,
        sector: "",
        cell: "",
        village: ""
      }));
    } else if (name === 'sector') {
      setFormData(prev => ({
        ...prev,
        cell: "",
        village: ""
      }));
    } else if (name === 'cell') {
      setFormData(prev => ({
        ...prev,
        village: ""
      }));
    } else if (name === 'catchmentAreaType') {
      setCatchmentDistrict("");
      setCatchmentSector("");
      setCatchmentCell("");
      setCatchmentInput("");
    }
  };

  const handleAddCatchment = () => {
    if (catchmentInput.trim() && !formData.catchmentArea.includes(catchmentInput.trim())) {
      setFormData(prev => ({
        ...prev,
        catchmentArea: [...prev.catchmentArea, catchmentInput.trim()]
      }));
      setCatchmentInput("");
    }
  };

  const handleRemoveCatchment = (area: string) => {
    setFormData(prev => ({
      ...prev,
      catchmentArea: prev.catchmentArea.filter(a => a !== area)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      name: formData.name,
      province: formData.province,
      district: formData.district,
      sector: formData.sector,
      cell: formData.cell,
      village: formData.village,
      contact: formData.contact,
      email: formData.email,
      chwSupervisor: formData.chwSupervisor,
      chwSupervisorContact: formData.chwSupervisorContact,
      catchmentArea: formData.catchmentArea
    };

    if (hospital) {
      // Update existing hospital
      updateMutation.mutate({ id: hospital.id, data: submitData });
    } else {
      // Create new hospital
      createMutation.mutate(submitData);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hospital ? "Edit Hospital" : "Add New Hospital"}
      big={true}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hospital Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

        {/* Location Information */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province *
              </label>
              <select
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Province</option>
                {locations.provinces.map(province => (
                  <option key={province.id} value={province.name}>{province.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.province}
              >
                <option value="">Select District</option>
                {formData.province && locations.provinces
                  .find(p => p.name === formData.province)?.districts
                  .map(district => (
                    <option key={district.id} value={district.name}>{district.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector *
              </label>
              <select
                name="sector"
                value={formData.sector}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.district}
              >
                <option value="">Select Sector</option>
                {formData.district && getSectorOptions(formData.district).map(sector => (
                  <option key={sector.id} value={sector.id}>{sector.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cell
              </label>
              <select
                name="cell"
                value={formData.cell}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.sector}
              >
                <option value="">Select Cell</option>
                {formData.sector && getCellOptions(formData.sector).map(cell => (
                  <option key={cell.id} value={cell.id}>{cell.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Village
              </label>
              <select
                name="village"
                value={formData.village}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.cell}
              >
                <option value="">Select Village</option>
                {formData.cell && getVillageOptions(formData.cell).map(village => (
                  <option key={village.id} value={village.id}>{village.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number
            </label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* CHW Supervisor Information */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">CHW Supervisor Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CHW Supervisor Name
              </label>
              <input
                type="text"
                name="chwSupervisor"
                value={formData.chwSupervisor}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supervisor Contact
              </label>
              <input
                type="tel"
                name="chwSupervisorContact"
                value={formData.chwSupervisorContact}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Catchment Area */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Catchment Area</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catchment Area Type
              </label>
              <select
                name="catchmentAreaType"
                value={formData.catchmentAreaType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="district">District</option>
                <option value="sector">Sector</option>
                <option value="cell">Cell</option>
                <option value="village">Village</option>
              </select>
            </div>

            {formData.catchmentAreaType !== 'district' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <select
                  value={catchmentDistrict}
                  onChange={(e) => {
                    setCatchmentDistrict(e.target.value);
                    setCatchmentSector("");
                    setCatchmentCell("");
                    setCatchmentInput("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.province}
                >
                  <option value="">Select District</option>
                  {formData.province && locations.provinces
                    .find(p => p.name === formData.province)?.districts
                    .map(district => (
                      <option key={district.id} value={district.name}>{district.name}</option>
                    ))}
                </select>
              </div>
            )}

            {(formData.catchmentAreaType === 'cell' || formData.catchmentAreaType === 'village') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector
                </label>
                <select
                  value={catchmentSector}
                  onChange={(e) => {
                    setCatchmentSector(e.target.value);
                    setCatchmentCell("");
                    setCatchmentInput("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!catchmentDistrict}
                >
                  <option value="">Select Sector</option>
                  {catchmentDistrict && getSectorOptions(catchmentDistrict)
                    .map(sector => (
                      <option key={sector.id} value={sector.id}>{sector.label}</option>
                    ))}
                </select>
              </div>
            )}

            {formData.catchmentAreaType === 'village' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cell
                </label>
                <select
                  value={catchmentCell}
                  onChange={(e) => {
                    setCatchmentCell(e.target.value);
                    setCatchmentInput("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!catchmentSector}
                >
                  <option value="">Select Cell</option>
                  {catchmentSector && getCellOptions(catchmentSector)
                    .map(cell => (
                      <option key={cell.id} value={cell.id}>{cell.label}</option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add {formData.catchmentAreaType.charAt(0).toUpperCase() + formData.catchmentAreaType.slice(1)}s
            </label>
            <div className="flex gap-2 mb-2">
              <select
                value={catchmentInput}
                onChange={(e) => setCatchmentInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select {formData.catchmentAreaType}</option>
                {formData.catchmentAreaType === 'district' && formData.province && locations.provinces
                  .find(p => p.name === formData.province)?.districts
                  .filter(d => !formData.catchmentArea.includes(d.name))
                  .map(district => (
                    <option key={district.id} value={district.name}>{district.name}</option>
                  ))}
                {formData.catchmentAreaType === 'sector' && catchmentDistrict && getSectorOptions(catchmentDistrict)
                  .filter(s => !formData.catchmentArea.includes(s.label))
                  .map(sector => (
                    <option key={sector.id} value={sector.label}>{sector.label}</option>
                  ))}
                {formData.catchmentAreaType === 'cell' && catchmentSector && getCellOptions(catchmentSector)
                  .filter(c => !formData.catchmentArea.includes(c.label))
                  .map(cell => (
                    <option key={cell.id} value={cell.label}>{cell.label}</option>
                  ))}
                {formData.catchmentAreaType === 'village' && catchmentCell && getVillageOptions(catchmentCell)
                  .filter(v => !formData.catchmentArea.includes(v.label))
                  .map(village => (
                    <option key={village.id} value={village.label}>{village.label}</option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAddCatchment}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                disabled={!catchmentInput}
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {formData.catchmentArea.map((area, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => handleRemoveCatchment(area)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : (hospital ? "Update Hospital" : "Create Hospital")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default HospitalFormDialog;