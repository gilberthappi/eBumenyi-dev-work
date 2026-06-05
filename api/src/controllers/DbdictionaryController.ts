import express, { Request, Response } from "express";
import {
  generateDatabaseDictionary,
  generateHTMLDictionary,
  generateMarkdownDictionary,
  saveDictionaryToFile,
} from "../utils/dbDictionary";

const router = express.Router();

// GET /api/dictionary
router.get("/dictionary", async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as "json" | "html" | "markdown") || "json";
    const download = req.query.download === "true";

    const dictionary = await generateDatabaseDictionary();

    if (download) {
      await saveDictionaryToFile(format);
      return res.json({
        message: `Dictionary saved as ${format} file`,
        timestamp: dictionary.generatedAt,
      });
    }

    switch (format) {
      case "html":
        res.setHeader("Content-Type", "text/html");
        // You would need to implement the HTML generation function
        res.send(generateHTMLDictionary(dictionary));
        break;
      case "markdown":
        res.setHeader("Content-Type", "text/markdown");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="database-dictionary-${new Date().toISOString().split("T")[0]}.md"`,
        );
        // You would need to implement the Markdown generation function
        res.send(generateMarkdownDictionary(dictionary));
        break;
      default:
        res.json(dictionary);
    }
  } catch (error) {
    console.error("Error generating dictionary:", error);
    res.status(500).json({
      error: "Failed to generate database dictionary",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/dictionary/generate
router.post("/dictionary/generate", async (req: Request, res: Response) => {
  try {
    const format = (req.body.format as "json" | "html" | "markdown") || "json";
    const dictionary = await saveDictionaryToFile(format);

    res.json({
      message: `Database dictionary generated successfully as ${format}`,
      format,
      generatedAt: dictionary.generatedAt,
      tablesCount: dictionary.tables.length,
    });
  } catch (error) {
    console.error("Error generating dictionary file:", error);
    res.status(500).json({
      error: "Failed to generate dictionary file",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Health check extended with database info
router.get("/database-info", async (req: Request, res: Response) => {
  try {
    const dictionary = await generateDatabaseDictionary();

    res.json({
      status: "healthy",
      database: dictionary.database,
      version: dictionary.version,
      tablesCount: dictionary.tables.length,
      generatedAt: dictionary.generatedAt,
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: "Failed to fetch database information",
    });
  }
});

// Removed unused helper functions generateHTMLDictionary and generateMarkdownDictionary

export default router;
