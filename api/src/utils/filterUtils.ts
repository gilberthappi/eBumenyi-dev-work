/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface FilterOptions {
  searchq?: string;
  district?: string;
  sector?: string;
  dateRange?: DateRangeFilter;
  limit?: number;
  currentPage?: number;
}

export interface ExportOptions {
  format: "excel";
  filename?: string;
  filters?: FilterOptions;
}

// Validation function to ensure only compatible filters are used together
export function validateFilterOptions(filters: FilterOptions): {
  isValid: boolean;
  error?: string;
} {
  const hasDateRange =
    filters.dateRange?.startDate && filters.dateRange?.endDate;
  const hasDistrict = !!filters.district;
  const hasSector = !!filters.sector;

  // Cannot filter by both district and sector
  if (hasDistrict && hasSector) {
    return {
      isValid: false,
      error: "Cannot filter by both district and sector simultaneously",
    };
  }

  // Date range validation
  if (hasDateRange) {
    const startDate = new Date(filters.dateRange!.startDate);
    const endDate = new Date(filters.dateRange!.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        isValid: false,
        error: "Invalid date format. Please use YYYY-MM-DD format",
      };
    }

    if (startDate > endDate) {
      return {
        isValid: false,
        error: "Start date cannot be after end date",
      };
    }

    // Check if date range is too wide (more than 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > oneYear) {
      return {
        isValid: false,
        error: "Date range cannot exceed 1 year",
      };
    }
  }

  return { isValid: true };
}

export function buildPrismaWhereClause(
  filters: FilterOptions,
  userPath: string = "user",
  modelType?:
    | "feedback"
    | "course-review"
    | "section-review"
    | "chapter-review"
    | "system-review",
): Record<string, any> {
  const where: Record<string, any> = {};

  // Search query with model-specific fields
  if (filters.searchq) {
    const searchConditions: Record<string, any>[] = [];

    // Helper function to create nested user search conditions
    const createUserSearchCondition = (field: string) => {
      if (userPath === "user") {
        return {
          user: {
            [field]: { contains: filters.searchq, mode: "insensitive" },
          },
        };
      } else if (userPath === "student.user") {
        return {
          student: {
            user: {
              [field]: { contains: filters.searchq, mode: "insensitive" },
            },
          },
        };
      }
      // Fallback for other paths
      return {
        [userPath]: {
          [field]: { contains: filters.searchq, mode: "insensitive" },
        },
      };
    };

    // Add user-related search conditions
    searchConditions.push(
      createUserSearchCondition("fullNames"),
      createUserSearchCondition("phoneNumber"),
      createUserSearchCondition("district"),
      createUserSearchCondition("sector"),
      createUserSearchCondition("cell"),
    );

    // Add model-specific content fields
    switch (modelType) {
      case "feedback":
        searchConditions.push({
          message: { contains: filters.searchq, mode: "insensitive" },
        });
        break;
      case "course-review":
        searchConditions.push(
          { comment: { contains: filters.searchq, mode: "insensitive" } },
          {
            course: {
              title: { contains: filters.searchq, mode: "insensitive" },
            },
          },
          {
            categoryRatings: {
              some: {
                OR: [
                  {
                    category: {
                      contains: filters.searchq,
                      mode: "insensitive",
                    },
                  },
                  {
                    label: { contains: filters.searchq, mode: "insensitive" },
                  },
                ],
              },
            },
          },
        );
        break;
      case "section-review":
        searchConditions.push(
          { comment: { contains: filters.searchq, mode: "insensitive" } },
          {
            section: {
              title: { contains: filters.searchq, mode: "insensitive" },
            },
          },
          {
            categoryRatings: {
              some: {
                OR: [
                  {
                    category: {
                      contains: filters.searchq,
                      mode: "insensitive",
                    },
                  },
                  {
                    label: { contains: filters.searchq, mode: "insensitive" },
                  },
                ],
              },
            },
          },
        );
        break;
      case "chapter-review":
        searchConditions.push(
          { comment: { contains: filters.searchq, mode: "insensitive" } },
          {
            chapter: {
              title: { contains: filters.searchq, mode: "insensitive" },
            },
          },
          {
            categoryRatings: {
              some: {
                OR: [
                  {
                    category: {
                      contains: filters.searchq,
                      mode: "insensitive",
                    },
                  },
                  {
                    label: { contains: filters.searchq, mode: "insensitive" },
                  },
                ],
              },
            },
          },
        );
        break;
      case "system-review":
        searchConditions.push(
          { feedback: { contains: filters.searchq, mode: "insensitive" } },
          {
            recommendation: {
              contains: filters.searchq,
              mode: "insensitive",
            },
          },
          {
            categoryRatings: {
              some: {
                OR: [
                  {
                    category: {
                      contains: filters.searchq,
                      mode: "insensitive",
                    },
                  },
                  {
                    label: { contains: filters.searchq, mode: "insensitive" },
                  },
                ],
              },
            },
          },
        );
        break;
    }

    where.OR = searchConditions;
  }

  // Helper function to create nested user filter conditions
  const createUserFilterCondition = (field: string, value: string) => {
    if (userPath === "user") {
      return {
        user: {
          [field]: { equals: value, mode: "insensitive" },
        },
      };
    } else if (userPath === "student.user") {
      return {
        student: {
          user: {
            [field]: { equals: value, mode: "insensitive" },
          },
        },
      };
    }
    // Fallback for other paths
    return {
      [userPath]: {
        [field]: { equals: value, mode: "insensitive" },
      },
    };
  };

  // District filter
  if (filters.district) {
    Object.assign(
      where,
      createUserFilterCondition("district", filters.district),
    );
  }

  // Sector filter
  if (filters.sector) {
    Object.assign(where, createUserFilterCondition("sector", filters.sector));
  }

  // Date range filter
  if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
    const startDate = new Date(filters.dateRange.startDate);
    const endDate = new Date(filters.dateRange.endDate);
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    where.createdAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  return where;
}

export function getFilterMetadata(
  filters: FilterOptions,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  if (filters.district) {
    metadata["Filtered by District"] = filters.district;
  }

  if (filters.sector) {
    metadata["Filtered by Sector"] = filters.sector;
  }

  if (filters.dateRange?.startDate && filters.dateRange?.endDate) {
    metadata["Date Range"] =
      `${filters.dateRange.startDate} to ${filters.dateRange.endDate}`;
  }

  if (filters.searchq) {
    metadata["Search Query"] = filters.searchq;
  }

  return metadata;
}
