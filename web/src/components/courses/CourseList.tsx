/* eslint-disable react-hooks/exhaustive-deps */
import {
  useState,
  FC,
  useCallback,
  useEffect,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import { ICourse } from "@/types";
import Table from "@/components/table/Table";
import TableActions from "@/components/table/TableActions";
import PageContent from "@/components/common/PageContent";
import { formatDate } from "@/utils/formats/formats";
import { getAllCourses } from "@/services/course.service";
import { courseKeys } from "@/utils/constants/queryKeys";
import CourseTableActions from "./CourseTableActions";

interface ListProps {
  hideHeader?: boolean;
  filter?: string;
}

const CourseList: FC<ListProps> = ({ hideHeader = false, filter }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Build query parameters
  const buildQueryParams = (page: number, keyword?: string) => {
    const params = new URLSearchParams();
    
    if (page > 1) params.append('page', page.toString());
    if (keyword) params.append('searchq', keyword);
    
    // Add filter for published status
    if (filter === "published") {
      params.append('isPublished', 'true');
    } else if (filter === "draft") {
      params.append('isPublished', 'false');
    }
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  // Main query with all parameters including filter
  const { data, isLoading } = useQuery({
    queryKey: courseKeys.list(`${filter}-${buildQueryParams(currentPage, searchKeyword)}`),
    queryFn: () => getAllCourses(buildQueryParams(currentPage, searchKeyword)),
  });

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((searchTerm: string) => {
      setSearchKeyword(searchTerm);
      setCurrentPage(1);
    }, 500),
    [filter],
  );

  // Page change handler
  const onChangePage = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page and search when filter changes
  const resetFilters = () => {
    setCurrentPage(1);
    setSearchKeyword("");
  };

  // Effect to reset pagination and search when filter changes
  useEffect(() => {
    resetFilters();
  }, [filter]);


 const tableContent = (
    <>
      <Table
        isLoading={isLoading}
        currentPage={data?.currentPage || 1}
        totalItems={data?.totalItems || 30}
        itemsPerPage={data?.itemsPerPage || 15}
        onChangePage={onChangePage}
        columns={[
          {
            title: "Course Title",
            key: "title",
          },
        {
            title: "Enrolled",
            key: "enrolled",
            render: (row: ICourse) => (
              <div>
                {row.progresses?.length || 0}
              </div>
            ),
          },
            {
            title: "Reviews",
            key: "reviews",
            render: (row: ICourse) => (
                      <span className="flex items-center gap-1">
                          <span className="text-yellow-500 text-lg">★</span>
                          <span className="text-[#333333]">{row.rating || 0}</span>
                      </span>
            ),
          },
          {
            title: "Created",
            key: "createdAt",
            render: (row: ICourse) => (
              <div className="text-sm text-gray-600">
                {formatDate(row.createdAt)}
              </div>
            ),
          },
                    {
            title: "Status",
            key: "isPublished",
            render: (row: ICourse) => (
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  row.isPublished
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {row.isPublished ? "Published" : "Draft"}
              </span>
            ),
          },
            {
            title: "Created By",
            key: "creator",
            render: (row: ICourse) => (
              <div className="max-w-xs truncate" title={row.staff.user.fullNames}>
                {row.staff.user.fullNames || "No creator"}
              </div>
            ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (row: ICourse) => {
              return (
                <TableActions>
                  <CourseTableActions item={row} />
                </TableActions>
              );
            },
          },
        ]}
        data={data?.data || []}
        searchFun={handleSearch}
      />
    </>
  );
  if (hideHeader) {
    return <div className='w-full'>{tableContent}</div>;
  }
  return (
    <PageContent
      isLoading={isLoading}
      hasPadding={true}
      title='Courses'
    >
      {tableContent}
    </PageContent>
  );
};

export default CourseList;