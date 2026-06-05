import * as XLSX from "xlsx";
import { Response } from "express";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  type?: "string" | "number" | "date" | "email" | "phone";
}

export interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  columns: ExcelColumn[];
  data: Record<string, unknown>[];
  title?: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}

export class ExcelExporter {
  private static createStyledWorkbook(
    options: ExcelExportOptions,
  ): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();

    // Create worksheet data array
    const wsData: unknown[][] = [];

    // Add title if provided
    let currentRow = 0;
    if (options.title) {
      wsData.push([options.title]);
      wsData.push([]); // Empty row
      currentRow += 2;
    }

    // Add subtitle if provided
    if (options.subtitle) {
      wsData.push([options.subtitle]);
      wsData.push([]); // Empty row
      currentRow += 2;
    }

    // Add metadata if provided
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        wsData.push([`${key}:`, value]);
        currentRow++;
      });
      wsData.push([]); // Empty row
      currentRow++;
    }

    // Add headers
    const headerRow = options.columns.map((col) => col.header);
    wsData.push(headerRow);
    const headerRowIndex = currentRow;
    currentRow++;

    // Add data rows
    options.data.forEach((item) => {
      const row = options.columns.map((col) => {
        const value = this.getNestedValue(item, col.key);

        // Format based on type
        switch (col.type) {
          case "date":
            if (value && (value instanceof Date || typeof value === "string")) {
              const date = new Date(value);
              return date.toLocaleDateString();
            }
            return value;
          case "phone":
            return value ? String(value) : "";
          case "email":
            return value ? String(value).toLowerCase() : "";
          case "number":
            return value ? Number(value) : 0;
          default:
            return value || "";
        }
      });
      wsData.push(row);
      currentRow++;
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = options.columns.map((col) => ({
      wch:
        col.width ||
        this.calculateColumnWidth(col.header, options.data, col.key),
    }));
    ws["!cols"] = colWidths;

    // Style the worksheet
    this.applyWorksheetStyles(ws, headerRowIndex, options);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName);

    return wb;
  }

  private static getNestedValue(
    obj: Record<string, unknown>,
    path: string,
  ): unknown {
    return path.split(".").reduce((current: unknown, key: string) => {
      if (!current || typeof current !== "object" || current === null) {
        return "";
      }

      // Handle array indices (e.g., "categoryRatings.0.category")
      if (/^\d+$/.test(key)) {
        const index = parseInt(key, 10);
        if (Array.isArray(current)) {
          return current[index] || "";
        }
        return "";
      }

      // Handle object properties
      return key in current ? (current as Record<string, unknown>)[key] : "";
    }, obj);
  }

  private static calculateColumnWidth(
    header: string,
    data: Record<string, unknown>[],
    key: string,
  ): number {
    let maxLength = header.length;

    // Check a sample of data to determine optimal width
    const sampleSize = Math.min(50, data.length);
    for (let i = 0; i < sampleSize; i++) {
      const value = this.getNestedValue(data[i], key);
      const stringValue = String(value || "");
      maxLength = Math.max(maxLength, stringValue.length);
    }

    // Apply reasonable limits with padding and special cases
    const minWidth = 10;
    const maxWidth = 50;
    const padding = 3;

    // Special width adjustments for different data types
    if (key.includes("phone") || key.includes("Phone")) {
      return Math.max(15, Math.min(20, maxLength + padding));
    }

    if (key.includes("email") || key.includes("Email")) {
      return Math.max(20, Math.min(35, maxLength + padding));
    }

    if (key.includes("date") || key.includes("Date") || key.includes("At")) {
      return Math.max(12, Math.min(18, maxLength + padding));
    }

    if (
      key.includes("district") ||
      key.includes("sector") ||
      key.includes("cell")
    ) {
      return Math.max(15, Math.min(25, maxLength + padding));
    }

    if (key.includes("Name") || key.includes("name")) {
      return Math.max(20, Math.min(30, maxLength + padding));
    }

    // Default width calculation
    return Math.max(minWidth, Math.min(maxWidth, maxLength + padding));
  }

  private static applyWorksheetStyles(
    ws: XLSX.WorkSheet,
    headerRowIndex: number,
    options: ExcelExportOptions,
  ) {
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

    // Apply header styles with Bootstrap primary theme
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: {
            bold: true,
            color: { rgb: "FFFFFF" },
            size: 13,
            name: "Segoe UI",
          },
          fill: { fgColor: { rgb: "0D6EFD" } }, // Bootstrap primary blue
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            top: { style: "medium", color: { rgb: "0B5ED7" } },
            bottom: { style: "medium", color: { rgb: "0B5ED7" } },
            left: { style: "thin", color: { rgb: "FFFFFF" } },
            right: { style: "thin", color: { rgb: "FFFFFF" } },
          },
        };
      }
    }

    // Apply enhanced title style with Bootstrap success theme
    if (options.title && ws["A1"]) {
      ws["A1"].s = {
        font: {
          bold: true,
          size: 20,
          color: { rgb: "198754" }, // Bootstrap success green
          name: "Segoe UI",
        },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "D1E7DD" } }, // Light success background
        border: {
          top: { style: "medium", color: { rgb: "198754" } },
          bottom: { style: "medium", color: { rgb: "198754" } },
          left: { style: "medium", color: { rgb: "198754" } },
          right: { style: "medium", color: { rgb: "198754" } },
        },
      };
    }

    // Apply enhanced subtitle style with Bootstrap info theme
    if (options.subtitle) {
      const subtitleCell = options.title ? "A3" : "A1";
      if (ws[subtitleCell]) {
        ws[subtitleCell].s = {
          font: {
            bold: true,
            size: 16,
            color: { rgb: "0DCAF0" }, // Bootstrap info cyan
            name: "Segoe UI",
          },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "CFF4FC" } }, // Light info background
        };
      }
    }

    // Apply metadata styles with Bootstrap secondary theme
    if (options.metadata && Object.keys(options.metadata).length > 0) {
      let metadataStartRow = 1;
      if (options.title) metadataStartRow += 2;
      if (options.subtitle) metadataStartRow += 2;

      Object.keys(options.metadata).forEach((_, index) => {
        const metadataRow = metadataStartRow + index;
        const cellAddress = XLSX.utils.encode_cell({ r: metadataRow, c: 0 });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: {
              bold: true,
              size: 11,
              color: { rgb: "6C757D" }, // Bootstrap secondary
              name: "Segoe UI",
            },
            fill: { fgColor: { rgb: "E9ECEF" } }, // Light secondary background
            alignment: { horizontal: "left", vertical: "center" },
            border: {
              bottom: { style: "thin", color: { rgb: "ADB5BD" } },
            },
          };
        }
      });
    }

    // Apply Bootstrap-inspired alternating row colors
    for (let row = headerRowIndex + 1; row <= range.e.r; row++) {
      const isEvenRow = (row - headerRowIndex) % 2 === 0;
      const fillColor = isEvenRow ? "F8F9FA" : "FFFFFF"; // Bootstrap light/white alternating

      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: {
              size: 12,
              color: { rgb: "212529" }, // Bootstrap dark
              name: "Segoe UI",
            },
            fill: { fgColor: { rgb: fillColor } },
            border: {
              top: { style: "thin", color: { rgb: "DEE2E6" } }, // Bootstrap border
              bottom: { style: "thin", color: { rgb: "DEE2E6" } },
              left: { style: "thin", color: { rgb: "DEE2E6" } },
              right: { style: "thin", color: { rgb: "DEE2E6" } },
            },
            alignment: {
              vertical: "center",
              horizontal: "left",
              indent: 1,
            },
          };
        }
      }
    }

    // Apply Bootstrap-themed formatting for specific column types
    for (let col = range.s.c; col <= range.e.c; col++) {
      const columnDef = options.columns[col];
      if (columnDef) {
        for (let row = headerRowIndex + 1; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          if (ws[cellAddress] && ws[cellAddress].s) {
            // Date columns - Bootstrap info color
            if (columnDef.type === "date") {
              ws[cellAddress].s.alignment = {
                ...ws[cellAddress].s.alignment,
                horizontal: "center",
              };
              ws[cellAddress].s.font = {
                ...ws[cellAddress].s.font,
                color: { rgb: "0DCAF0" }, // Bootstrap info
              };
            }

            // Phone columns - Bootstrap success color
            if (columnDef.type === "phone") {
              ws[cellAddress].s.font = {
                ...ws[cellAddress].s.font,
                color: { rgb: "198754" }, // Bootstrap success
              };
            }

            // Email columns - Bootstrap warning color
            if (columnDef.type === "email") {
              ws[cellAddress].s.font = {
                ...ws[cellAddress].s.font,
                color: { rgb: "FFC107" }, // Bootstrap warning
              };
            }

            // Number columns - Bootstrap danger color for emphasis
            if (columnDef.type === "number") {
              ws[cellAddress].s.font = {
                ...ws[cellAddress].s.font,
                color: { rgb: "DC3545" }, // Bootstrap danger
                bold: true,
              };
              ws[cellAddress].s.alignment = {
                ...ws[cellAddress].s.alignment,
                horizontal: "right",
              };
            }
          }
        }
      }
    }
  }

  public static async exportToExcel(
    options: ExcelExportOptions,
    res?: Response,
  ): Promise<Buffer> {
    const wb = this.createStyledWorkbook(options);
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    if (res) {
      const filename = `${options.filename}_${new Date().toISOString().split("T")[0]}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.setHeader("Content-Length", buffer.length);

      res.send(buffer);
    }

    return buffer;
  }

  public static createMultiSheetWorkbook(): XLSX.WorkBook {
    return XLSX.utils.book_new();
  }

  public static addSheetToWorkbook(
    workbook: XLSX.WorkBook,
    options: ExcelExportOptions,
    sheetName?: string,
  ): void {
    // Create sheet data array
    const wsData: (string | number)[][] = [];

    // Header metadata (if provided)
    let currentRow = 0;
    if (options.title) {
      wsData.push([options.title]);
      currentRow++;
    }
    if (options.subtitle) {
      wsData.push([options.subtitle]);
      currentRow++;
    }

    // Add metadata if provided
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        wsData.push([`${key}: ${value}`]);
        currentRow++;
      });
      // Add empty row after metadata
      wsData.push([]);
      currentRow++;
    }

    // Add column headers
    const headerRowIndex = currentRow;
    const headers = options.columns.map((col) => col.header);
    wsData.push(headers);
    currentRow++;

    // Add data rows
    options.data.forEach((item) => {
      const row = options.columns.map((col) => {
        const value = this.getNestedValue(item, col.key);
        switch (col.type) {
          case "date":
            return value ? new Date(value as string).toLocaleDateString() : "";
          case "phone":
            return value ? `+${value}` : "";
          case "email":
            return value || "";
          default:
            return value?.toString() || "";
        }
      });
      wsData.push(row as (string | number)[]);
      currentRow++;
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = options.columns.map((col) => ({
      wch:
        col.width ||
        this.calculateColumnWidth(col.header, options.data, col.key),
    }));
    ws["!cols"] = colWidths;

    // Add freeze panes to keep headers visible
    if (headerRowIndex >= 0) {
      ws["!freeze"] = { xSplit: 0, ySplit: headerRowIndex + 1 };
    }

    // Set print settings for better printing
    ws["!printHeader"] = [headerRowIndex, headerRowIndex];
    ws["!margins"] = {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    };

    // Enable autofilter on headers
    if (options.data.length > 0) {
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      ws["!autofilter"] = {
        ref: XLSX.utils.encode_range({
          s: { r: headerRowIndex, c: 0 },
          e: { r: range.e.r, c: range.e.c },
        }),
      };
    }

    // Style the worksheet
    this.applyWorksheetStyles(ws, headerRowIndex, options);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(
      workbook,
      ws,
      sheetName || options.sheetName || "Data",
    );
  }

  public static async exportMultiSheetToExcel(
    workbook: XLSX.WorkBook,
    filename: string,
    res?: Response,
  ): Promise<Buffer> {
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    if (res) {
      const fullFilename = `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fullFilename}"`,
      );

      res.write(buffer);
      res.end();
    }

    return buffer;
  }

  public static createFeedbackExcelTemplate(
    data: Record<string, unknown>[],
    metadata?: Record<string, unknown>,
  ): ExcelExportOptions {
    return {
      filename: "feedbacks_export",
      sheetName: "Feedbacks",
      title: "Feedback Report",
      subtitle: "Community Health Worker Training Platform",
      metadata: {
        "Export Date": new Date().toLocaleDateString(),
        "Total Records": data.length,
        ...metadata,
      },
      columns: [
        { header: "User Name", key: "user.fullNames", width: 25 },
        { header: "Phone", key: "user.phoneNumber", type: "phone", width: 15 },
        { header: "District", key: "user.district", width: 15 },
        { header: "Sector", key: "user.sector", width: 15 },
        { header: "Cell", key: "user.cell", width: 15 },
        {
          header: "Course",
          key: "slide.chapter.section.course.title",
          width: 30,
        },
        { header: "Section", key: "slide.chapter.section.title", width: 25 },
        { header: "Chapter", key: "slide.chapter.title", width: 25 },
        {
          header: "Slide Number",
          key: "slide.slideNumber",
          type: "number",
          width: 12,
        },
        { header: "Message", key: "message", width: 50 },
        { header: "Created Date", key: "createdAt", type: "date", width: 15 },
      ],
      data,
    };
  }

  public static createReviewExcelTemplate(
    data: Record<string, unknown>[],
    type: "course" | "section" | "chapter" | "system",
    metadata?: Record<string, unknown>,
  ): ExcelExportOptions {
    const baseColumns: ExcelColumn[] = [
      {
        header: "User Name",
        key: type === "system" ? "user.fullNames" : "student.user.fullNames",
        width: 25,
      },
      {
        header: "Phone",
        key:
          type === "system" ? "user.phoneNumber" : "student.user.phoneNumber",
        type: "phone" as const,
        width: 15,
      },
      {
        header: "District",
        key: type === "system" ? "user.district" : "student.user.district",
        width: 15,
      },
      {
        header: "Sector",
        key: type === "system" ? "user.sector" : "student.user.sector",
        width: 15,
      },
      {
        header: "Cell",
        key: type === "system" ? "user.cell" : "student.user.cell",
        width: 15,
      },
    ];

    // Determine the maximum number of category ratings from the data
    const maxCategoryRatings = this.getMaxCategoryRatings(data);

    const typeSpecificColumns: ExcelColumn[] =
      type === "system"
        ? [
            { header: "Feedback", key: "feedback", width: 50 },
            { header: "Recommendation", key: "recommendation", width: 10 },
            {
              header: "Overall Rating",
              key: "overallRating",
              type: "number" as const,
              width: 15,
            },
            // Dynamic Category Ratings for System Reviews
            ...this.generateCategoryRatingColumns(maxCategoryRatings, 40),
          ]
        : [
            {
              header:
                type === "course"
                  ? "Course"
                  : type === "section"
                    ? "Section"
                    : "Chapter",
              key: `${type}.title`,
              width: 30,
            },
            { header: "Comment", key: "comment", width: 50 },
            {
              header: "Rating",
              key: "rating",
              type: "number" as const,
              width: 12,
            },
            // Dynamic Category Ratings for Course/Section/Chapter Reviews
            ...this.generateCategoryRatingColumns(maxCategoryRatings, 20),
          ];

    const endColumns: ExcelColumn[] = [
      {
        header: "Created Date",
        key: "createdAt",
        type: "date" as const,
        width: 15,
      },
    ];

    return {
      filename: `${type}_reviews_export`,
      sheetName: `${type.charAt(0).toUpperCase() + type.slice(1)} Reviews`,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Review Report`,
      subtitle: "Community Health Worker Training Platform",
      metadata: {
        "Export Date": new Date().toLocaleDateString(),
        "Total Records": data.length,
        ...metadata,
      },
      columns: [...baseColumns, ...typeSpecificColumns, ...endColumns],
      data,
    };
  }

  private static getMaxCategoryRatings(
    data: Record<string, unknown>[],
  ): number {
    let maxCount = 0;

    data.forEach((item) => {
      const categoryRatings = this.getNestedValue(item, "categoryRatings");
      if (Array.isArray(categoryRatings)) {
        maxCount = Math.max(maxCount, categoryRatings.length);
      }
    });

    return maxCount;
  }

  private static generateCategoryRatingColumns(
    count: number,
    categoryWidth: number,
  ): ExcelColumn[] {
    const columns: ExcelColumn[] = [];

    for (let i = 0; i < count; i++) {
      columns.push({
        header: `Category ${i + 1}`,
        key: `categoryRatings.${i}.category`,
        width: categoryWidth,
      });
      columns.push({
        header: `Rating ${i + 1}`,
        key: `categoryRatings.${i}.rating`,
        type: "number" as const,
        width: 10,
      });
    }

    return columns;
  }
}
