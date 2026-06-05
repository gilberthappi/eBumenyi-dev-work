// const express = require("express");
// const multer = require("multer");
// const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
// const axios = require("axios");
// const fs = require("fs");
// const path = require("path");

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Configure multer for file upload
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage: storage });
// app.use(express.json());

// // Create necessary directories
// if (!fs.existsSync("uploads")) {
//   fs.mkdirSync("uploads", { recursive: true });
// }
// if (!fs.existsSync("templates")) {
//   fs.mkdirSync("templates", { recursive: true });
// }
// if (!fs.existsSync("temp")) {
//   fs.mkdirSync("temp", { recursive: true });
// }

// /**
//  * Function to generate certificate with custom name, course title, and completion date
//  * @param {string} studentName - Name of the student
//  * @param {string} courseTitle - Title of the course
//  * @param {string} completionDate - Date of completion
//  * @returns {Promise<Buffer>} - Generated PDF as buffer
//  */
// async function generateCertificatePDF(
//   studentName,
//   courseTitle,
//   completionDate,
// ) {
//   try {
//     // Load the PDF template
//     const pdfBytes = await fs.promises.readFile(
//       "./templates/certificate_template.pdf",
//     );
//     const pdfDoc = await PDFDocument.load(pdfBytes);
//     const pages = pdfDoc.getPages();
//     const firstPage = pages[0];

//     // Embed font
//     const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//     // Replace student name
//     // Draw white rectangle to cover existing text (precise coverage)
//     firstPage.drawRectangle({
//       x: 250, // Start from left edge of name area
//       y: 325, // Bottom edge of name area
//       width: 342, // Width to cover existing name
//       height: 40, // Precise height to cover only the name
//       color: rgb(1, 1, 1), // White color to cover existing text
//     });

//     // Calculate text width for proper centering
//     const textWidth = studentName.length * 26 * 0.6; // Approximate text width
//     const centeredX = 421 - textWidth / 2; // Center the text horizontally at PDF center

//     // Draw the student name
//     firstPage.drawText(studentName, {
//       x: centeredX, // Horizontally centered at PDF center
//       y: 340 - 9, // Slightly adjusted vertically for better positioning
//       size: 26,
//       color: rgb(0, 0, 0),
//       font: helveticaBold,
//     });

//     // Replace course title
//     // Remove old course title with precise coverage area
//     firstPage.drawRectangle({
//       x: 20, // Start from left margin
//       y: 180, // Start higher to accommodate multi-line text
//       width: 802, // Cover text width only (leaving margins)
//       height: 85, // Height to cover multiple lines but not lines below
//       color: rgb(1, 1, 1), // White color to cover existing text
//     });

//     // Add new course title with automatic line wrapping
//     const maxLineWidth = 700; // Maximum width for each line (in points)
//     const courseFontSize = 18;
//     const lineHeight = 25; // Space between lines

//     // Function to wrap text into multiple lines
//     function wrapText(text, maxWidth, font, size) {
//       const words = text.split(" ");
//       const lines = [];
//       let currentLine = "";

//       for (const word of words) {
//         const testLine = currentLine ? currentLine + " " + word : word;
//         const testWidth = testLine.length * size * 0.6; // Approximate width calculation

//         if (testWidth <= maxWidth) {
//           currentLine = testLine;
//         } else {
//           if (currentLine) {
//             lines.push(currentLine);
//             currentLine = word;
//           } else {
//             lines.push(word); // Word too long, add anyway
//           }
//         }
//       }

//       if (currentLine) {
//         lines.push(currentLine);
//       }

//       return lines;
//     }

//     // Wrap the course title into multiple lines
//     const titleLines = wrapText(
//       courseTitle,
//       maxLineWidth,
//       helveticaBold,
//       courseFontSize,
//     );

//     // Calculate starting Y position based on number of lines (center vertically)
//     const totalHeight = (titleLines.length - 1) * lineHeight;
//     const startY = 220 + totalHeight / 2; // Start higher if multiple lines

//     // Draw each line of the course title
//     titleLines.forEach((line, index) => {
//       const lineWidth = line.length * courseFontSize * 0.6;
//       const centeredX = 421 - lineWidth / 2; // Center each line

//       firstPage.drawText(line, {
//         x: centeredX,
//         y: startY - index * lineHeight,
//         size: courseFontSize,
//         color: rgb(0.4, 0.435, 0.722), // #666fb8 color converted to RGB
//         font: helveticaBold,
//       });
//     });

//     // Add completion date
//     // First cover any existing date text with white rectangle
//     firstPage.drawRectangle({
//       x: 300, // Start from left of date area
//       y: 165, // Bottom edge of date area (moved down)
//       width: 240, // Width to cover existing date text
//       height: 25, // Height to cover date text only
//       color: rgb(1, 1, 1), // White color to cover existing text
//     });

//     // Calculate text width for proper centering
//     const dateWidth = completionDate.length * 18 * 0.6; // Approximate text width for date
//     const centeredDateX = 420 - dateWidth / 2; // Center the date horizontally at x=420

//     firstPage.drawText(completionDate, {
//       x: centeredDateX, // Horizontally centered at x=420
//       y: 175, // Position moved down to y=155 to avoid covering lines
//       size: 18, // Font size 18
//       color: rgb(0, 0, 0), // Black color
//       font: helveticaBold,
//     });

//     // Draw horizontal line below the date to separate it from "Italiki"
//     firstPage.drawLine({
//       start: { x: 350, y: 165 },
//       end: { x: 490, y: 165 },
//       thickness: 1,
//       color: rgb(0, 0, 0),
//     });

//     // Note: Horizontal lines are preserved from original template
//     // by using precise white rectangle coverage that doesn't overlap the lines

//     // Save and return the modified PDF
//     return await pdfDoc.save();
//   } catch (error) {
//     console.error("Error generating certificate PDF:", error);
//     throw error;
//   }
// }

// /**
//  * COORDINATE FINDER HELPER
//  * This creates a grid overlay PDF to help find exact coordinates
//  */
// app.get("/api/find-coordinates", async (req, res) => {
//   try {
//     const { gridSpacing = 50, fontSize = 10 } = req.query;
//     const spacing = parseInt(gridSpacing);

//     // Try to load the template
//     let pdfBytes;
//     try {
//       pdfBytes = await fs.promises.readFile(
//         "./templates/certificate_template.pdf",
//       );
//     } catch (error) {
//       return res.status(400).json({
//         error: "Template not found",
//         message:
//           "Please place certificate_template.pdf in the templates folder",
//       });
//     }

//     // Load the PDF
//     const pdfDoc = await PDFDocument.load(pdfBytes);
//     const pages = pdfDoc.getPages();
//     const firstPage = pages[0];

//     // Get dimensions
//     const { width, height } = firstPage.getSize();

//     // Embed fonts
//     const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

//     // Draw coordinate grid
//     // Vertical lines
//     for (let x = 0; x <= width; x += spacing) {
//       firstPage.drawLine({
//         start: { x, y: 0 },
//         end: { x, y: height },
//         thickness: 0.5,
//         color: rgb(1, 0, 0), // Red color
//         opacity: 0.3,
//       });

//       // X coordinate labels at top
//       firstPage.drawText(`x=${x}`, {
//         x: x + 2,
//         y: height - 20,
//         size: parseInt(fontSize),
//         color: rgb(1, 0, 0),
//         font: helveticaFont,
//       });

//       // X coordinate labels at bottom
//       firstPage.drawText(`x=${x}`, {
//         x: x + 2,
//         y: 10,
//         size: parseInt(fontSize),
//         color: rgb(1, 0, 0),
//         font: helveticaFont,
//       });
//     }

//     // Horizontal lines
//     for (let y = 0; y <= height; y += spacing) {
//       firstPage.drawLine({
//         start: { x: 0, y },
//         end: { x: width, y },
//         thickness: 0.5,
//         color: rgb(0, 0, 1), // Blue color
//         opacity: 0.3,
//       });

//       // Y coordinate labels on left
//       firstPage.drawText(`y=${y}`, {
//         x: 5,
//         y: y + 2,
//         size: parseInt(fontSize),
//         color: rgb(0, 0, 1),
//         font: helveticaFont,
//       });

//       // Y coordinate labels on right
//       firstPage.drawText(`y=${y}`, {
//         x: width - 60,
//         y: y + 2,
//         size: parseInt(fontSize),
//         color: rgb(0, 0, 1),
//         font: helveticaFont,
//       });
//     }

//     // Draw center lines
//     firstPage.drawLine({
//       start: { x: width / 2, y: 0 },
//       end: { x: width / 2, y: height },
//       thickness: 1,
//       color: rgb(0, 1, 0), // Green color
//     });

//     firstPage.drawLine({
//       start: { x: 0, y: height / 2 },
//       end: { x: width, y: height / 2 },
//       thickness: 1,
//       color: rgb(0, 1, 0), // Green color
//     });

//     // Mark the center
//     firstPage.drawText(`CENTER (${width / 2}, ${height / 2})`, {
//       x: width / 2 - 50,
//       y: height / 2 + 20,
//       size: 12,
//       color: rgb(0, 0.5, 0),
//       font: helveticaBold,
//     });

//     // Draw crosshairs at suggested positions for name placement
//     const suggestions = [
//       { x: width / 2, y: height * 0.6, label: "Suggested Name Position" },
//       { x: width / 2, y: height * 0.58, label: "Alternative Position 1" },
//       { x: width / 2, y: height * 0.62, label: "Alternative Position 2" },
//     ];

//     suggestions.forEach((pos, index) => {
//       // Draw crosshair
//       firstPage.drawLine({
//         start: { x: pos.x - 20, y: pos.y },
//         end: { x: pos.x + 20, y: pos.y },
//         thickness: 1,
//         color: rgb(0.8, 0.2, 0.8), // Purple
//       });

//       firstPage.drawLine({
//         start: { x: pos.x, y: pos.y - 20 },
//         end: { x: pos.x, y: pos.y + 20 },
//         thickness: 1,
//         color: rgb(0.8, 0.2, 0.8), // Purple
//       });

//       // Label the position
//       firstPage.drawText(
//         `${pos.label} (${Math.round(pos.x)}, ${Math.round(pos.y)})`,
//         {
//           x: pos.x - 60,
//           y: pos.y + 30,
//           size: 8,
//           color: rgb(0.8, 0.2, 0.8),
//           font: helveticaFont,
//         },
//       );
//     });

//     // Add instructions text
//     firstPage.drawText("INSTRUCTIONS:", {
//       x: 20,
//       y: height - 40,
//       size: 12,
//       color: rgb(0, 0, 0),
//       font: helveticaBold,
//     });

//     firstPage.drawText("1. Open this PDF alongside your template", {
//       x: 20,
//       y: height - 60,
//       size: 10,
//       color: rgb(0, 0, 0),
//       font: helveticaFont,
//     });

//     firstPage.drawText('2. Find where "Richard Lester" appears in template', {
//       x: 20,
//       y: height - 75,
//       size: 10,
//       color: rgb(0, 0, 0),
//       font: helveticaFont,
//     });

//     firstPage.drawText("3. Note the x,y coordinates from grid lines", {
//       x: 20,
//       y: height - 90,
//       size: 10,
//       color: rgb(0, 0, 0),
//       font: helveticaFont,
//     });

//     firstPage.drawText("4. Use those coordinates in the API", {
//       x: 20,
//       y: height - 105,
//       size: 10,
//       color: rgb(0, 0, 0),
//       font: helveticaFont,
//     });

//     // Save the grid PDF
//     const gridPdfBytes = await pdfDoc.save();

//     // Send as response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       'attachment; filename="coordinate_grid.pdf"',
//     );
//     res.send(Buffer.from(gridPdfBytes));
//   } catch (error) {
//     console.error("Error creating coordinate grid:", error);
//     res.status(500).json({
//       error: "Failed to create coordinate grid",
//       details: error.message,
//     });
//   }
// });

// /**
//  * Create a test PDF to visualize name placement
//  */
// app.post("/api/test-position", async (req, res) => {
//   try {
//     const {
//       name = "Dushimimana Gilbert happi",
//       x = 300,
//       y = 400,
//       rectWidth = 180,
//       rectHeight = 25,
//       fontSize = 14,
//       showGrid = false,
//     } = req.body;

//     const pdfBytes = await fs.promises.readFile(
//       "./templates/certificate_template.pdf",
//     );
//     const pdfDoc = await PDFDocument.load(pdfBytes);
//     const pages = pdfDoc.getPages();
//     const firstPage = pages[0];

//     const { width, height } = firstPage.getSize();
//     const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
//     const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

//     // Optional: Draw grid for reference
//     if (showGrid) {
//       for (let gridX = 0; gridX <= width; gridX += 50) {
//         firstPage.drawLine({
//           start: { x: gridX, y: 0 },
//           end: { x: gridX, y: height },
//           thickness: 0.3,
//           color: rgb(0.9, 0.9, 0.9),
//         });
//       }
//       for (let gridY = 0; gridY <= height; gridY += 50) {
//         firstPage.drawLine({
//           start: { x: 0, y: gridY },
//           end: { x: width, y: gridY },
//           thickness: 0.3,
//           color: rgb(0.9, 0.9, 0.9),
//         });
//       }
//     }

//     // Draw red target marker
//     firstPage.drawCircle({
//       x: parseFloat(x),
//       y: parseFloat(y),
//       size: 5,
//       color: rgb(1, 0, 0),
//     });

//     firstPage.drawLine({
//       start: { x: parseFloat(x) - 15, y: parseFloat(y) },
//       end: { x: parseFloat(x) + 15, y: parseFloat(y) },
//       thickness: 1,
//       color: rgb(1, 0, 0),
//     });

//     firstPage.drawLine({
//       start: { x: parseFloat(x), y: parseFloat(y) - 15 },
//       end: { x: parseFloat(x), y: parseFloat(y) + 15 },
//       thickness: 1,
//       color: rgb(1, 0, 0),
//     });

//     // Draw white rectangle to cover old text
//     firstPage.drawRectangle({
//       x: parseFloat(x) - parseFloat(rectWidth) / 2,
//       y: parseFloat(y) - parseFloat(rectHeight) / 2,
//       width: parseFloat(rectWidth),
//       height: parseFloat(rectHeight),
//       color: rgb(1, 1, 1),
//     });

//     // Draw border around rectangle (for debugging)
//     firstPage.drawRectangle({
//       x: parseFloat(x) - parseFloat(rectWidth) / 2,
//       y: parseFloat(y) - parseFloat(rectHeight) / 2,
//       width: parseFloat(rectWidth),
//       height: parseFloat(rectHeight),
//       borderColor: rgb(0, 0, 1),
//       borderWidth: 0.5,
//     });

//     // Draw the name
//     firstPage.drawText(name, {
//       x: parseFloat(x) - name.length * fontSize * 0.3, // Approximate centering
//       y: parseFloat(y) - parseFloat(fontSize) / 3,
//       size: parseFloat(fontSize),
//       color: rgb(0, 0, 0),
//       font: helveticaBold,
//     });

//     // Display coordinates
//     firstPage.drawText(`Position: (${x}, ${y})`, {
//       x: 20,
//       y: 30,
//       size: 10,
//       color: rgb(1, 0, 0),
//       font: helvetica,
//     });

//     const modifiedPdfBytes = await pdfDoc.save();

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="test_position_${x}_${y}.pdf"`,
//     );
//     res.send(Buffer.from(modifiedPdfBytes));
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// /**
//  * Get PDF dimensions and info
//  */
// app.get("/api/pdf-info", async (req, res) => {
//   try {
//     const pdfBytes = await fs.promises.readFile(
//       "./templates/certificate_template.pdf",
//     );
//     const pdfDoc = await PDFDocument.load(pdfBytes);
//     const pages = pdfDoc.getPages();
//     const firstPage = pages[0];

//     const { width, height } = firstPage.getSize();

//     res.json({
//       dimensions: {
//         width: Math.round(width),
//         height: Math.round(height),
//         units: "points (1 point = 1/72 inch)",
//       },
//       pageCount: pdfDoc.getPageCount(),
//       suggestedNamePositions: [
//         {
//           x: Math.round(width / 2),
//           y: Math.round(height * 0.6),
//           description: "Center of page, 60% from bottom",
//         },
//         {
//           x: Math.round(width / 2),
//           y: Math.round(height * 0.58),
//           description: "Center, slightly higher",
//         },
//         {
//           x: Math.round(width / 2),
//           y: Math.round(height * 0.62),
//           description: "Center, slightly lower",
//         },
//         {
//           x: Math.round(width * 0.45),
//           y: Math.round(height * 0.6),
//           description: "Left of center",
//         },
//         {
//           x: Math.round(width * 0.55),
//           y: Math.round(height * 0.6),
//           description: "Right of center",
//         },
//       ],
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: "Failed to read template",
//       details: error.message,
//     });
//   }
// });

// /**
//  * INTERACTIVE COORDINATE FINDER - Web Interface
//  */
// app.get("/coordinate-finder", (req, res) => {
//   res.send(`
//     <!DOCTYPE html>
//     <html>
//     <head>
//         <title>PDF Coordinate Finder</title>
//         <style>
//             body { font-family: Arial, sans-serif; margin: 40px; max-width: 1000px; }
//             .container { display: flex; gap: 20px; }
//             .controls { flex: 1; }
//             .preview { flex: 2; }
//             form { background: #f5f5f5; padding: 20px; border-radius: 5px; }
//             label { display: block; margin: 10px 0 5px; }
//             input, button { padding: 8px; margin: 5px 0; width: 100%; box-sizing: border-box; }
//             button { background: #007bff; color: white; border: none; cursor: pointer; }
//             button:hover { background: #0056b3; }
//             .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
//             .result { background: #e9ffe9; padding: 15px; margin: 15px 0; border-radius: 5px; }
//             iframe { width: 100%; height: 600px; border: 1px solid #ccc; }
//         </style>
//     </head>
//     <body>
//         <h1>📐 PDF Coordinate Finder</h1>
//         <p>Use this tool to find the exact coordinates for placing text in your PDF certificate.</p>

//         <div class="container">
//             <div class="controls">
//                 <h2>Step 1: Get PDF Info</h2>
//                 <button onclick="getPdfInfo()">Get PDF Dimensions</button>
//                 <div id="pdfInfo"></div>

//                 <h2>Step 2: Generate Coordinate Grid</h2>
//                 <form onsubmit="generateGrid(event)">
//                     <label>Grid Spacing:</label>
//                     <input type="number" id="gridSpacing" value="50" min="10" max="200">
//                     <label>Font Size:</label>
//                     <input type="number" id="fontSize" value="10" min="8" max="20">
//                     <button type="submit">Generate Grid PDF</button>
//                 </form>

//                 <h2>Step 3: Test Coordinates</h2>
//                 <form onsubmit="testCoordinates(event)">
//                     <div class="grid">
//                         <div>
//                             <label>Name:</label>
//                             <input type="text" id="testName" value="Gilbert happi" required>
//                         </div>
//                         <div>
//                             <label>Font Size:</label>
//                             <input type="number" id="testFontSize" value="14" min="8" max="30">
//                         </div>
//                         <div>
//                             <label>X Position:</label>
//                             <input type="number" id="testX" value="300" step="10">
//                         </div>
//                         <div>
//                             <label>Y Position:</label>
//                             <input type="number" id="testY" value="400" step="10">
//                         </div>
//                         <div>
//                             <label>Rectangle Width:</label>
//                             <input type="number" id="rectWidth" value="180" step="10">
//                         </div>
//                         <div>
//                             <label>Rectangle Height:</label>
//                             <input type="number" id="rectHeight" value="25" step="5">
//                         </div>
//                     </div>
//                     <label>
//                         <input type="checkbox" id="showGrid"> Show Grid in Test
//                     </label>
//                     <button type="submit">Test These Coordinates</button>
//                 </form>

//                 <h2>Step 4: Quick Adjustments</h2>
//                 <div class="grid">
//                     <button onclick="adjustPosition(-10, 0)">← Move Left 10</button>
//                     <button onclick="adjustPosition(10, 0)">Move Right 10 →</button>
//                     <button onclick="adjustPosition(0, 10)">Move Up 10 ↑</button>
//                     <button onclick="adjustPosition(0, -10)">↓ Move Down 10</button>
//                     <button onclick="adjustSize(10, 0)">Width +10</button>
//                     <button onclick="adjustSize(-10, 0)">Width -10</button>
//                     <button onclick="adjustSize(0, 10)">Height +10</button>
//                     <button onclick="adjustSize(0, -10)">Height -10</button>
//                 </div>
//             </div>

//             <div class="preview">
//                 <h2>Preview Area</h2>
//                 <div id="previewFrame">
//                     <p>Generated PDFs will appear here...</p>
//                 </div>
//             </div>
//         </div>

//         <script>
//             async function getPdfInfo() {
//                 const response = await fetch('/api/pdf-info');
//                 const data = await response.json();

//                 let html = '<div class="result">';
//                 html += \`<h3>PDF Dimensions: \${data.dimensions.width} × \${data.dimensions.height} points</h3>\`;
//                 html += '<h4>Suggested Starting Points:</h4><ul>';
//                 data.suggestedNamePositions.forEach(pos => {
//                     html += \`<li>(\${pos.x}, \${pos.y}) - \${pos.description}</li>\`;
//                 });
//                 html += '</ul></div>';

//                 document.getElementById('pdfInfo').innerHTML = html;
//             }

//             async function generateGrid(e) {
//                 e.preventDefault();
//                 const spacing = document.getElementById('gridSpacing').value;
//                 const fontSize = document.getElementById('fontSize').value;

//                 const response = await fetch(\`/api/find-coordinates?gridSpacing=\${spacing}&fontSize=\${fontSize}\`);
//                 const blob = await response.blob();
//                 const url = URL.createObjectURL(blob);

//                 document.getElementById('previewFrame').innerHTML = \`
//                     <iframe src="\${url}"></iframe>
//                     <p><a href="\${url}" download="coordinate_grid.pdf">Download Grid PDF</a></p>
//                 \`;
//             }

//             async function testCoordinates(e) {
//                 e.preventDefault();

//                 const data = {
//                     name: document.getElementById('testName').value,
//                     x: parseInt(document.getElementById('testX').value),
//                     y: parseInt(document.getElementById('testY').value),
//                     rectWidth: parseInt(document.getElementById('rectWidth').value),
//                     rectHeight: parseInt(document.getElementById('rectHeight').value),
//                     fontSize: parseInt(document.getElementById('testFontSize').value),
//                     showGrid: document.getElementById('showGrid').checked
//                 };

//                 const response = await fetch('/api/test-position', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify(data)
//                 });

//                 const blob = await response.blob();
//                 const url = URL.createObjectURL(blob);

//                 document.getElementById('previewFrame').innerHTML = \`
//                     <iframe src="\${url}"></iframe>
//                     <p><a href="\${url}" download="test_position.pdf">Download Test PDF</a></p>
//                     <p>Current coordinates: (\${data.x}, \${data.y})</p>
//                 \`;
//             }

//             function adjustPosition(dx, dy) {
//                 const xInput = document.getElementById('testX');
//                 const yInput = document.getElementById('testY');
//                 xInput.value = parseInt(xInput.value) + dx;
//                 yInput.value = parseInt(yInput.value) + dy;
//                 // Auto-test with new coordinates
//                 document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
//             }

//             function adjustSize(dw, dh) {
//                 const widthInput = document.getElementById('rectWidth');
//                 const heightInput = document.getElementById('rectHeight');
//                 if (dw !== 0) widthInput.value = parseInt(widthInput.value) + dw;
//                 if (dh !== 0) heightInput.value = parseInt(heightInput.value) + dh;
//                 // Auto-test with new size
//                 document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
//             }

//             // Initialize with default test
//             window.onload = function() {
//                 getPdfInfo();
//                 setTimeout(() => {
//                     document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
//                 }, 500);
//             };
//         </script>
//     </body>
//     </html>
//   `);
// });

// /**
//  * Generate certificate with custom name and course title
//  */
// app.post("/api/generate-certificate", async (req, res) => {
//   try {
//     const {
//       studentName = "Gilbert happi",
//       courseTitle = "GUKUMIRA NO KWITA KU BURESE BWO MU BUZIMA BW'ABANTU, INDWARA ZANDURA, NO GUTERA INKUNGA ABANTU BAFITE IBIBAZO BY'UBUZIMA",
//       completionDate = "04, Ukuboza 2025",
//     } = req.body;

//     // Use the reusable function
//     const modifiedPdfBytes = await generateCertificatePDF(
//       studentName,
//       courseTitle,
//       completionDate,
//     );

//     // Send PDF as response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="certificate_${studentName.replace(/\s+/g, "_")}.pdf"`,
//     );
//     res.send(Buffer.from(modifiedPdfBytes));
//   } catch (error) {
//     console.error("Error generating certificate:", error);
//     res.status(500).json({
//       error: "Failed to generate certificate",
//       details: error.message,
//     });
//   }
// });

// /**
//  * GET endpoint for quick certificate generation (for testing)
//  */
// app.get("/generate-certificate", async (req, res) => {
//   try {
//     const {
//       name = "Tuyishimire Patrick",
//       course = "UBUZIMA BWO HEJURU NO KWIGA KUBANA N'UBUZIMA",
//       date = "05 Ukuboza 2025",
//     } = req.query;

//     // Use the reusable function
//     const modifiedPdfBytes = await generateCertificatePDF(name, course, date);

//     // Send PDF as response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="certificate_${name.replace(/\s+/g, "_")}.pdf"`,
//     );
//     res.send(Buffer.from(modifiedPdfBytes));
//   } catch (error) {
//     console.error("Error generating certificate:", error);
//     res.status(500).json({
//       error: "Failed to generate certificate",
//       details: error.message,
//     });
//   }
// });

// /**
//  * Simple certificate generator page with form inputs
//  */
// app.get("/", (req, res) => {
//   res.send(`
//     <!DOCTYPE html>
//     <html>
//     <head>
//         <title>Certificate Generator</title>
//         <style>
//             body {
//                 font-family: Arial, sans-serif;
//                 margin: 0;
//                 padding: 40px;
//                 background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//                 min-height: 100vh;
//                 display: flex;
//                 justify-content: center;
//                 align-items: center;
//             }
//             .container {
//                 background: white;
//                 padding: 40px;
//                 border-radius: 15px;
//                 box-shadow: 0 10px 30px rgba(0,0,0,0.2);
//                 text-align: center;
//                 max-width: 600px;
//                 width: 100%;
//             }
//             h1 {
//                 color: #333;
//                 margin-bottom: 30px;
//                 font-size: 2.2em;
//             }
//             .form-group {
//                 margin: 20px 0;
//                 text-align: left;
//             }
//             label {
//                 display: block;
//                 margin-bottom: 8px;
//                 font-weight: bold;
//                 color: #333;
//             }
//             input, textarea {
//                 width: 100%;
//                 padding: 12px;
//                 border: 1px solid #ddd;
//                 border-radius: 6px;
//                 font-size: 14px;
//                 box-sizing: border-box;
//             }
//             textarea {
//                 height: 80px;
//                 resize: vertical;
//             }
//             .generate-btn {
//                 background: linear-gradient(45deg, #667eea, #764ba2);
//                 color: white;
//                 border: none;
//                 padding: 15px 40px;
//                 font-size: 18px;
//                 border-radius: 8px;
//                 cursor: pointer;
//                 transition: all 0.3s;
//                 box-shadow: 0 4px 15px rgba(0,0,0,0.2);
//                 margin-top: 20px;
//             }
//             .generate-btn:hover {
//                 transform: translateY(-2px);
//                 box-shadow: 0 6px 20px rgba(0,0,0,0.3);
//             }
//             .loading {
//                 display: none;
//                 margin-top: 20px;
//                 color: #667eea;
//             }
//             .status {
//                 margin-top: 20px;
//                 padding: 10px;
//                 border-radius: 5px;
//             }
//             .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
//             .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
//             .links {
//                 margin-top: 30px;
//                 font-size: 14px;
//                 color: #666;
//             }
//             .links a {
//                 color: #667eea;
//                 text-decoration: none;
//                 margin: 0 10px;
//             }
//             .links a:hover {
//                 text-decoration: underline;
//             }
//         </style>
//     </head>
//     <body>
//         <div class="container">
//             <h1>🎓 Certificate Generator</h1>

//             <form id="certificateForm">
//                 <div class="form-group">
//                     <label for="studentName">Student Name:</label>
//                     <input type="text" id="studentName" name="studentName" value="Gilbert happi" required>
//                 </div>

//                 <div class="form-group">
//                     <label for="courseTitle">Course Title:</label>
//                     <textarea id="courseTitle" name="courseTitle" placeholder="Enter course title..." required>GUKUMIRA NO KWITA KU BURESE BWO MU BUZIMA BW'ABANTU, INDWARA ZANDURA, NO GUTERA INKUNGA ABANTU BAFITE IBIBAZO BY'UBUZIMA</textarea>
//                 </div>

//                 <div class="form-group">
//                     <label for="completionDate">Completion Date:</label>
//                     <input type="text" id="completionDate" name="completionDate" value="03, Ukuboza 2025" required>
//                 </div>

//                 <button type="submit" class="generate-btn">
//                     📄 Generate Certificate
//                 </button>
//             </form>

//             <div class="loading" id="loading">
//                 ⏳ Generating certificate...
//             </div>

//             <div id="status"></div>

//             <div class="links">
//                 <a href="/coordinate-finder">🔧 Coordinate Finder</a>
//             </div>
//         </div>

//         <script>
//             document.getElementById('certificateForm').addEventListener('submit', async function(e) {
//                 e.preventDefault();

//                 const btn = document.querySelector('.generate-btn');
//                 const loading = document.getElementById('loading');
//                 const status = document.getElementById('status');

//                 const studentName = document.getElementById('studentName').value;
//                 const courseTitle = document.getElementById('courseTitle').value;
//                 const completionDate = document.getElementById('completionDate').value;

//                 // Show loading state
//                 btn.disabled = true;
//                 loading.style.display = 'block';
//                 status.innerHTML = '';

//                 try {
//                     const response = await fetch('/api/generate-certificate', {
//                         method: 'POST',
//                         headers: {
//                             'Content-Type': 'application/json',
//                         },
//                         body: JSON.stringify({
//                             studentName: studentName,
//                             courseTitle: courseTitle,
//                             completionDate: completionDate
//                         })
//                     });

//                     if (response.ok) {
//                         const blob = await response.blob();
//                         const url = window.URL.createObjectURL(blob);
//                         const a = document.createElement('a');
//                         a.href = url;
//                         a.download = \`certificate_\${studentName.replace(/\\s+/g, '_')}.pdf\`;
//                         document.body.appendChild(a);
//                         a.click();
//                         document.body.removeChild(a);

//                         status.innerHTML = '<div class="status success">✅ Certificate generated and downloaded!</div>';
//                     } else {
//                         const error = await response.json();
//                         status.innerHTML = '<div class="status error">❌ Error: ' + (error.message || 'Failed to generate certificate') + '</div>';
//                     }
//                 } catch (error) {
//                     status.innerHTML = '<div class="status error">❌ Network error: ' + error.message + '</div>';
//                 }

//                 // Hide loading state
//                 btn.disabled = false;
//                 loading.style.display = 'none';
//             });
//         </script>
//     </body>
//     </html>
//   `);
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
//   console.log("📍 Coordinate Finder: http://localhost:3000/coordinate-finder");
//   console.log("📊 Endpoints:");
//   console.log(
//     "  POST /api/generate-certificate - Generate certificate (accepts studentName & courseTitle)",
//   );
//   console.log(
//     "  GET  /generate-certificate    - Generate certificate (accepts name & course as query params)",
//   );
//   console.log(
//     "  GET  /coordinate-finder       - Interactive coordinate finder tool",
//   );
//   console.log(
//     "  GET  /                        - Main certificate generator interface",
//   );
//   console.log("\n🎯 Quick test:");
//   console.log("  Visit: http://localhost:3000/");
//   console.log("  API: POST http://localhost:3000/api/generate-certificate");
//   console.log(
//     '       Body: { "studentName": "John Doe", "courseTitle": "Course Name" }',
//   );
// });
