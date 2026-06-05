import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import Table from "@/components/table/Table";
import { IHospital } from "@/types";
import { getAllHospitals } from "@/services/hospitals.service";
import { formatDate } from "@/utils/formats/formats";
import { LuCirclePlus } from "react-icons/lu";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import TableActions from "@/components/table/TableActions";
import HospitalTableActions from "@/components/hospitals/HospitalTableActions";
import HospitalFormDialog from "@/components/hospitals/HospitalFormDialog";
import ImportHospitalsDialog from "@/components/hospitals/ImportHospitalsDialog";
import { hospitalKeys } from "@/utils/constants/queryKeys";

const PROVINCE_OPTIONS = [
  { label: "Kigali", value: "Kigali" },
  { label: "Eastern", value: "Eastern" },
  { label: "Western", value: "Western" },
  { label: "Northern", value: "Northern" },
  { label: "Southern", value: "Southern" },
];

const Hospitals: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [limit, setLimit] = useState(15);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [provinceFilter, setProvinceFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<IHospital | null>(null);

  const buildQueryParams = (page: number, keyword?: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.append("page", page.toString());
    if (keyword) params.append("searchq", keyword);
    params.append("limit", limit.toString());
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);
    if (provinceFilter) params.append("province", provinceFilter);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  const { data, isLoading } = useQuery({
    queryKey: hospitalKeys.list(
      `${buildQueryParams(currentPage, searchKeyword)}`,
    ),
    queryFn: () => getAllHospitals(buildQueryParams(currentPage, searchKeyword)),
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(
    debounce((searchTerm: string) => {
      setSearchKeyword(searchTerm);
      setCurrentPage(1);
    }, 500),
    [],
  );

  const handleSort = (key: string, direction: "asc" | "desc") => {
    setSortBy(key);
    setOrder(direction);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setCurrentPage(1);
    setSearchKeyword("");
    setSortBy("createdAt");
    setOrder("desc");
    setProvinceFilter("");
  };

  const handleAddHospital = () => {
    setSelectedHospital(null);
    setIsFormOpen(true);
  };

  const handleEditHospital = (hospital: IHospital) => {
    setSelectedHospital(hospital);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#333333]">
            CHW Hospital Management
          </h2>
          <p className="text-gray-600">
            Manage hospitals and their associated CHW supervisors
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-medium transition-all duration-300 hover:bg-gray-50"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={handleAddHospital}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium transition-all duration-500 ease-in-out hover:bg-[#073e92]"
          >
            <LuCirclePlus className="text-xl" />
            <span>Add Hospital</span>
          </button>
        </div>
      </div>

      <Table
        isLoading={isLoading}
        currentPage={data?.currentPage || 1}
        totalItems={data?.totalItems || 0}
        itemsPerPage={limit}
        onChangePage={(page) => setCurrentPage(page)}
        searchFun={handleSearch}
        onSort={handleSort}
        currentSortKey={sortBy}
        currentSortOrder={order}
        onRowsPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setCurrentPage(1);
        }}
        filters={[
          {
            key: "province",
            label: "Province",
            value: provinceFilter,
            onChange: (val) => {
              setProvinceFilter(val);
              setCurrentPage(1);
            },
            options: PROVINCE_OPTIONS,
          },
        ]}
        selectable={true}
        onSelectionChange={(ids) => setSelectedIds(ids)}
        onResetFilters={resetFilters}
        columns={[
          {
            title: "Hospital Name",
            key: "name",
            sortable: true,
            render: (row: IHospital) => {
              const locationParts = [row.district, row.sector].filter(Boolean);
              return (
                <div>
                  <div className="font-medium text-gray-900">{row.name}</div>
                  <div className="text-sm text-gray-500">
                    {locationParts.join(", ")}
                  </div>
                </div>
              );
            },
          },
          {
            title: "Province",
            key: "province",
            sortable: true,
            render: (row: IHospital) => (
              <div className="text-sm text-gray-700">{row.province || "—"}</div>
            ),
          },
          {
            title: "CHW Supervisor",
            key: "chwSupervisor",
            render: (row: IHospital) => (
              <div>
                <div className="font-medium text-gray-900">
                  {row.chwSupervisor || "—"}
                </div>
                <div className="text-sm text-gray-500">
                  {row.chwSupervisorContact}
                </div>
              </div>
            ),
          },
          {
            title: "CHW Count",
            key: "totalChws",
            sortable: true,
            render: (row: IHospital) => (
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {row.activeChws}/{row.totalChws}
                </div>
                <div className="text-sm text-gray-500">Active/Total</div>
              </div>
            ),
          },
          {
            title: "Catchment Area",
            key: "catchmentArea",
            render: (row: IHospital) => (
              <div className="flex flex-wrap gap-1">
                {row.catchmentArea?.slice(0, 2).map((area, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {area}
                  </span>
                ))}
                {row.catchmentArea?.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{row.catchmentArea.length - 2} more
                  </span>
                )}
              </div>
            ),
          },
          {
            title: "Contact",
            key: "contact",
            render: (row: IHospital) => (
              <div className="text-sm text-gray-700">
                {row.contact && <div>{row.contact}</div>}
                {row.email && (
                  <div className="text-gray-500">{row.email}</div>
                )}
              </div>
            ),
          },
          {
            title: "Created",
            key: "createdAt",
            sortable: true,
            render: (row: IHospital) => (
              <div className="text-sm text-gray-600">
                {formatDate(row.createdAt)}
              </div>
            ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (row: IHospital) => (
              <TableActions>
                <HospitalTableActions item={row} onEdit={handleEditHospital} />
              </TableActions>
            ),
          },
        ]}
        data={data?.data || []}
      />

      <HospitalFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedHospital(null);
        }}
        hospital={selectedHospital}
      />

      <ImportHospitalsDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </div>
  );
};

export default Hospitals;
