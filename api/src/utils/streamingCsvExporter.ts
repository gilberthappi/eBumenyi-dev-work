import { Response } from "express";
import { Transform } from "stream";

/**
 * Streaming CSV Exporter
 * Exports large datasets to CSV without loading entire dataset into memory
 * Handles 1M+ rows efficiently with constant memory usage
 */
export class StreamingCsvExporter {
  /**
   * Convert array of objects to CSV with streaming
   * Processes one row at a time instead of loading entire dataset
   */
  public static async streamToCSV(
    dataIterator: AsyncIterableIterator<Record<string, unknown>>,
    columns: string[],
    res: Response,
    filename: string,
  ): Promise<void> {
    // Set response headers for CSV download
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}.csv"`,
    );
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Pragma", "no-cache");

    try {
      // Write BOM for Excel UTF-8 compatibility
      res.write("\uFEFF");

      // Write CSV header
      const header = columns.map((col) => this.escapeCsvValue(col)).join(",");
      res.write(header + "\n");

      let rowCount = 0;

      // Stream data row by row
      for await (const row of dataIterator) {
        const csvRow = columns
          .map((col) => this.escapeCsvValue(String(row[col] ?? "")))
          .join(",");

        res.write(csvRow + "\n");
        rowCount++;

        // Log progress every 10k rows
        if (rowCount % 10000 === 0) {
          console.log(`[CSV Stream] Exported ${rowCount} rows...`);
        }
      }

      res.end();
      console.log(
        `[CSV Stream] Export complete: ${rowCount} rows exported to ${filename}.csv`,
      );
    } catch (error) {
      console.error("[CSV Stream] Error during export:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Export failed" });
      } else {
        res.end();
      }
      throw error;
    }
  }

  /**
   * Create async generator for paginated database queries
   * Fetches data in batches to avoid memory overload
   * Yields one row at a time to streaming function
   */
  public static async *paginatedDataIterator(
    queryFn: (skip: number, take: number) => Promise<Record<string, unknown>[]>,
    pageSize: number = 1000,
  ): AsyncIterableIterator<Record<string, unknown>> {
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const batch = await queryFn(skip, pageSize);

        if (!batch || batch.length === 0) {
          hasMore = false;
          break;
        }

        // Yield each row individually
        for (const row of batch) {
          yield row;
        }

        skip += batch.length;

        // Stop if we got fewer rows than expected (end of data)
        if (batch.length < pageSize) {
          hasMore = false;
        }
      } catch (error) {
        console.error(
          `[CSV Stream] Error fetching batch at skip=${skip}:`,
          error,
        );
        hasMore = false;
        throw error;
      }
    }
  }

  /**
   * Escape CSV values to handle commas, quotes, and newlines
   * Wraps values in quotes if they contain special characters
   */
  private static escapeCsvValue(value: string): string {
    if (value === null || value === undefined) {
      return "";
    }

    // Convert to string if not already
    const str = String(value);

    // Check if value needs escaping
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      // Escape double quotes by doubling them
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  /**
   * Get columns from first row of data
   * Useful for dynamic column detection
   */
  public static getColumnsFromData(data: Record<string, unknown>[]): string[] {
    if (!data || data.length === 0) {
      return [];
    }

    return Object.keys(data[0]);
  }

  /**
   * Transform stream for filtering and mapping data
   * Allows data transformation without loading entire dataset
   */
  public static createTransformStream(
    transformFn: (
      row: Record<string, unknown>,
    ) => Record<string, unknown> | null,
  ): Transform {
    return new Transform({
      objectMode: true,
      transform(chunk: Record<string, unknown>, _encoding, callback) {
        try {
          const transformed = transformFn(chunk);
          if (transformed) {
            callback(null, transformed);
          } else {
            callback(); // Skip this row
          }
        } catch (error) {
          callback(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }
}
