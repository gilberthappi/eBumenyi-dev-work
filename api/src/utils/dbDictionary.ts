// utils/dbDictionary.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export interface DatabaseDictionary {
  generatedAt: string;
  database: string;
  version: string;
  tables: TableDefinition[];
}

export interface TableDefinition {
  name: string;
  description?: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  relations?: RelationDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  isPrimary: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  comment?: string;
  maxLength?: number;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  isUnique: boolean;
}

export interface RelationDefinition {
  name: string;
  type: string;
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
}

export async function generateDatabaseDictionary(): Promise<DatabaseDictionary> {
  try {
    // Get database info
    const dbInfo = await prisma.$queryRaw<
      { current_database: string; version: string }[]
    >`
      SELECT current_database(), version()
    `;

    // Get all tables from public schema
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const tableDefinitions: TableDefinition[] = [];

    for (const table of tables) {
      // Get columns with improved query to handle all cases
      const columns = await prisma.$queryRaw<ColumnDefinition[]>`
        SELECT 
          c.column_name as name,
          c.data_type as type,
          c.is_nullable = 'YES' as nullable,
          c.column_default as default,
          CASE 
            WHEN tc.constraint_type = 'PRIMARY KEY' THEN true 
            ELSE false 
          END as "isPrimary",
          CASE 
            WHEN tc.constraint_type = 'UNIQUE' THEN true 
            ELSE false 
          END as "isUnique",
          CASE 
            WHEN tc.constraint_type = 'FOREIGN KEY' THEN true 
            ELSE false 
          END as "isForeignKey",
          COALESCE(c.character_maximum_length, c.numeric_precision) as "maxLength",
          COALESCE(pgd.description, '') as comment
        FROM information_schema.columns c
        LEFT JOIN information_schema.key_column_usage kcu 
          ON c.table_name = kcu.table_name 
          AND c.column_name = kcu.column_name
          AND c.table_schema = kcu.table_schema
        LEFT JOIN information_schema.table_constraints tc 
          ON kcu.constraint_name = tc.constraint_name 
          AND kcu.table_schema = tc.table_schema
        LEFT JOIN pg_catalog.pg_statio_all_tables st 
          ON c.table_name = st.relname
        LEFT JOIN pg_catalog.pg_description pgd 
          ON pgd.objoid = st.relid 
          AND pgd.objsubid = c.ordinal_position
        WHERE c.table_schema = 'public' 
        AND c.table_name = ${table.table_name}
        ORDER BY c.ordinal_position
      `;

      // Get indexes with improved query
      const indexes = await prisma.$queryRaw<IndexDefinition[]>`
        SELECT
          i.relname as name,
          array_agg(a.attname) as columns,
          ix.indisunique as "isUnique"
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relkind = 'r'
        AND t.relname = ${table.table_name}
        GROUP BY i.relname, ix.indisunique
      `;

      // Get relations with improved query
      const relations = await prisma.$queryRaw<RelationDefinition[]>`
        SELECT
          tc.constraint_name as name,
          tc.constraint_type as type,
          ccu.table_name as "targetTable",
          kcu.column_name as "sourceColumn",
          ccu.column_name as "targetColumn"
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public'
        AND tc.table_name = ${table.table_name}
        AND tc.constraint_type IN ('FOREIGN KEY', 'PRIMARY KEY')
      `;

      tableDefinitions.push({
        name: table.table_name,
        columns: columns,
        indexes: indexes,
        relations: relations,
      });
    }

    const dictionary: DatabaseDictionary = {
      generatedAt: new Date().toISOString(),
      database: dbInfo[0].current_database,
      version: dbInfo[0].version,
      tables: tableDefinitions,
    };

    return dictionary;
  } catch (error) {
    console.error("Error generating database dictionary:", error);
    throw error;
  }
}

export async function saveDictionaryToFile(
  format: "json" | "html" | "markdown" = "json",
) {
  const dictionary = await generateDatabaseDictionary();
  const timestamp = new Date().toISOString().split("T")[0];

  switch (format) {
    case "json": {
      await fs.writeFile(
        path.join(__dirname, `../../database-dictionary-${timestamp}.json`),
        JSON.stringify(dictionary, null, 2),
      );
      break;
    }
    case "html": {
      const html = generateHTMLDictionary(dictionary);
      await fs.writeFile(
        path.join(__dirname, `../../database-dictionary-${timestamp}.html`),
        html,
      );
      break;
    }
    case "markdown": {
      const markdown = generateMarkdownDictionary(dictionary);
      await fs.writeFile(
        path.join(__dirname, `../../database-dictionary-${timestamp}.md`),
        markdown,
      );
      break;
    }
  }

  return dictionary;
}

export function generateHTMLDictionary(dictionary: DatabaseDictionary): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Database Dictionary - ${dictionary.database}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f8f9fa;
      max-width: 100%;
      margin: 0;
      padding: 1rem;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    /* Header Styles */
    .header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    @media (min-width: 768px) {
      .header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }
    
    .header h1 {
      color: #2c3e50;
      font-size: 1.8rem;
      margin: 0;
    }
    
    .search-container {
      position: relative;
      width: 100%;
    }
    
    @media (min-width: 768px) {
      .search-container {
        width: 300px;
      }
    }
    
    .search-bar {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.5rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }
    
    .search-bar:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6c757d;
    }
    
    /* Metadata Styles */
    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #6c757d;
    }
    
    .metadata-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    /* Export Buttons */
    .export-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .export-btns {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .btn-primary {
      background: #3498db;
      color: white;
    }
    
    .btn-primary:hover {
      background: #2980b9;
      transform: translateY(-2px);
    }
    
    .btn-success {
      background: #27ae60;
      color: white;
    }
    
    .btn-success:hover {
      background: #219a52;
      transform: translateY(-2px);
    }
    
    .btn-danger {
      background: #e74c3c;
      color: white;
    }
    
    .btn-danger:hover {
      background: #c0392b;
      transform: translateY(-2px);
    }
    
    /* ERD Styles */
    .erd-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .erd-section h2 {
      color: #2c3e50;
      margin-bottom: 1rem;
      font-size: 1.4rem;
    }
    
    .erd-canvas {
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      padding: 1.5rem;
      overflow-x: auto;
      min-height: 400px;
      white-space: nowrap;
    }
    
    .erd-table {
      display: inline-block;
      min-width: 200px;
      background: white;
      border: 2px solid #3498db;
      border-radius: 8px;
      margin: 0 1.5rem 1.5rem 0;
      padding: 1rem;
      vertical-align: top;
      white-space: normal;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    
    .erd-table:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    }
    
    .erd-table-title {
      font-weight: bold;
      font-size: 1.1rem;
      color: #2c3e50;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #3498db;
    }
    
    .erd-column {
      font-size: 0.85rem;
      margin-bottom: 0.25rem;
      padding: 0.25rem 0;
    }
    
    .erd-column.pk {
      color: #e74c3c;
      font-weight: 600;
    }
    
    .erd-column.fk {
      color: #3498db;
      font-weight: 500;
    }
    
    .erd-rel {
      color: #27ae60;
      font-size: 0.8rem;
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px dashed #dee2e6;
    }
    
    /* Table Cards */
    .tables-section {
      display: grid;
      gap: 1.5rem;
    }
    
    .table-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .table-card:hover {
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    }
    
    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      background: #2c3e50;
      color: white;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    
    .table-header:hover {
      background: #34495e;
    }
    
    .table-header h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }
    
    .toggle-icon {
      transition: transform 0.3s ease;
      font-size: 0.9rem;
    }
    
    .table-content {
      padding: 0;
      max-height: 0;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .table-content.expanded {
      padding: 1.5rem;
      max-height: none;
    }
    
    /* Responsive Table */
    .table-container {
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    
    .column-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    
    .column-table th {
      background: #f8f9fa;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 2px solid #dee2e6;
      white-space: nowrap;
    }
    
    .column-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #dee2e6;
      vertical-align: top;
    }
    
    .column-table tr:hover {
      background: #f8f9fa;
    }
    
    /* Column Type Styles */
    .primary-key {
      background: #ffeaea !important;
      border-left: 4px solid #e74c3c;
    }
    
    .foreign-key {
      background: #e8f4fd !important;
      border-left: 4px solid #3498db;
    }
    
    .unique {
      background: #f0e8ff !important;
      border-left: 4px solid #9b59b6;
    }
    
    /* Relationship Styles */
    .relationship-list {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      font-size: 0.9rem;
    }
    
    .relationship-list ul {
      list-style: none;
      margin: 0.5rem 0 0 0;
    }
    
    .relationship-list li {
      padding: 0.25rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    /* No Results */
    .no-results {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
      font-size: 1.1rem;
    }
    
    /* Loading State */
    .loading {
      opacity: 0.6;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1><i class="fas fa-database"></i> Database Dictionary</h1>
      <div class="search-container">
        <i class="fas fa-search search-icon"></i>
        <input 
          type="search" 
          class="search-bar" 
          id="searchInput" 
          placeholder="Search tables, columns, types..."
        />
      </div>
    </div>
    
    <!-- Metadata -->
    <div class="metadata">
      <div class="metadata-item">
        <i class="fas fa-database"></i>
        <strong>Database:</strong> ${dictionary.database}
      </div>
      <div class="metadata-item">
        <i class="fas fa-calendar"></i>
        <strong>Generated:</strong> ${new Date(dictionary.generatedAt).toLocaleString()}
      </div>
      <div class="metadata-item">
        <i class="fas fa-table"></i>
        <strong>Tables:</strong> ${dictionary.tables.length}
      </div>
      <div class="metadata-item">
        <i class="fas fa-code-branch"></i>
        <strong>Version:</strong> ${dictionary.version.split(" ")[1]}
      </div>
    </div>
    
    <!-- ERD Section -->
    <div class="erd-section">
      <h2><i class="fas fa-project-diagram"></i> Entity Relationship Diagram</h2>
      <div id="erd" class="erd-canvas">
        ${dictionary.tables
          .map(
            (table) => `
          <div class="erd-table" id="erd-table-${table.name}" data-table="${table.name.toLowerCase()}">
            <div class="erd-table-title">${table.name}</div>
            ${table.columns
              .slice(0, 8)
              .map(
                (column) => `
              <div class="erd-column ${column.isPrimary ? "pk" : column.isForeignKey ? "fk" : ""}">
                ${column.isPrimary ? "🔑 " : column.isForeignKey ? "🔗 " : "• "}
                ${column.name}
                <small style="color: #666; font-size: 0.8em;">(${column.type})</small>
              </div>
            `,
              )
              .join("")}
            ${
              table.columns.length > 8
                ? `
              <div class="erd-column" style="color: #999; font-style: italic;">
                + ${table.columns.length - 8} more columns...
              </div>
            `
                : ""
            }
            ${
              table.relations &&
              table.relations.filter((r) => r.type === "FOREIGN KEY").length > 0
                ? `
              <div class="erd-rel">
                <i class="fas fa-link"></i>
                ${table.relations.filter((r) => r.type === "FOREIGN KEY").length} foreign key(s)
              </div>
            `
                : ""
            }
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    
    <!-- Tables Section -->
    <div class="tables-section">
      <h2 style="color: #2c3e50; margin-bottom: 1rem;">
        <i class="fas fa-table"></i> Database Tables (${dictionary.tables.length})
      </h2>
      
      <div id="tables">
        ${dictionary.tables
          .map(
            (table, idx) => `
          <div class="table-card" data-table="${table.name.toLowerCase()}">
            <div class="table-header" onclick="toggleTableContent(${idx})">
              <h3>
                <i class="fas fa-table"></i>
                ${table.name}
                <small style="font-size: 0.8em; opacity: 0.8; margin-left: 0.5rem;">
                  (${table.columns.length} columns)
                </small>
              </h3>
              <span class="toggle-icon" id="toggle-icon-${idx}">▼</span>
            </div>
            <div class="table-content" id="table-content-${idx}">
              <div class="table-container">
                <table class="column-table">
                  <thead>
                    <tr>
                      <th>Column Name</th>
                      <th>Data Type</th>
                      <th>Nullable</th>
                      <th>Default Value</th>
                      <th>Constraints</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${table.columns
                      .map((column) => {
                        const constraints = [];
                        if (column.isPrimary) constraints.push("Primary Key");
                        if (column.isUnique) constraints.push("Unique");
                        if (column.isForeignKey)
                          constraints.push("Foreign Key");

                        const rowClass = column.isPrimary
                          ? "primary-key"
                          : column.isForeignKey
                            ? "foreign-key"
                            : column.isUnique
                              ? "unique"
                              : "";

                        return `
                        <tr class="${rowClass}">
                          <td>
                            <strong>${column.name}</strong>
                            ${column.isPrimary ? ' <i class="fas fa-key" style="color: #e74c3c;"></i>' : ""}
                            ${column.isForeignKey ? ' <i class="fas fa-link" style="color: #3498db;"></i>' : ""}
                          </td>
                          <td>
                            <code>${column.type}${column.maxLength ? `(${column.maxLength})` : ""}</code>
                          </td>
                          <td>
                            <span class="badge ${column.nullable ? "badge-yes" : "badge-no"}">
                              ${column.nullable ? "YES" : "NO"}
                            </span>
                          </td>
                          <td>
                            ${column.default ? `<code>${column.default}</code>` : "<em>None</em>"}
                          </td>
                          <td>
                            ${constraints.length > 0 ? constraints.join(", ") : "<em>None</em>"}
                          </td>
                          <td>
                            ${column.comment || "<em>No description</em>"}
                          </td>
                        </tr>
                      `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
              
              ${
                table.relations && table.relations.length > 0
                  ? `
                <div class="relationship-list">
                  <h4><i class="fas fa-project-diagram"></i> Table Relationships</h4>
                  <ul>
                    ${table.relations
                      .map(
                        (rel) => `
                      <li>
                        ${
                          rel.type === "FOREIGN KEY"
                            ? '<i class="fas fa-link" style="color: #3498db;"></i>'
                            : '<i class="fas fa-key" style="color: #e74c3c;"></i>'
                        }
                        <strong>${rel.sourceColumn}</strong> 
                        → 
                        <strong>${rel.targetTable}.${rel.targetColumn}</strong>
                        <span style="color: #6c757d; font-size: 0.9em;">(${rel.type})</span>
                      </li>
                    `,
                      )
                      .join("")}
                  </ul>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `,
          )
          .join("")}
        
        <div id="noResults" class="no-results" style="display: none;">
          <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
          <h3>No tables found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script>
    // Table content toggle
    function toggleTableContent(idx) {
      const content = document.getElementById('table-content-' + idx);
      const icon = document.getElementById('toggle-icon-' + idx);
      
      content.classList.toggle('expanded');
      icon.textContent = content.classList.contains('expanded') ? '▼' : '►';
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const tableCards = document.querySelectorAll('.table-card');
    const erdTables = document.querySelectorAll('.erd-table');
    const noResults = document.getElementById('noResults');
    
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      let visibleCount = 0;
      
      // Search in table cards
      tableCards.forEach(card => {
        const tableName = card.getAttribute('data-table');
        const columns = card.querySelectorAll('td');
        let columnMatch = false;
        
        columns.forEach(td => {
          if (td.textContent.toLowerCase().includes(searchTerm)) {
            columnMatch = true;
          }
        });
        
        const isVisible = tableName.includes(searchTerm) || columnMatch;
        card.style.display = isVisible ? 'block' : 'none';
        if (isVisible) visibleCount++;
      });
      
      // Search in ERD tables
      erdTables.forEach(table => {
        const tableName = table.getAttribute('data-table');
        const isVisible = tableName.includes(searchTerm);
        table.style.display = isVisible ? 'inline-block' : 'none';
      });
      
      // Show/hide no results message
      noResults.style.display = visibleCount === 0 && searchTerm !== '' ? 'block' : 'none';
    });
    
    // Export functionality
    document.getElementById('exportPNG').addEventListener('click', function() {
      this.classList.add('loading');
      html2canvas(document.getElementById('erd')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'database-erd.png';
        link.href = canvas.toDataURL();
        link.click();
        this.classList.remove('loading');
      });
    });
    
    document.getElementById('exportPDF').addEventListener('click', function() {
      this.classList.add('loading');
      html2canvas(document.getElementById('erd')).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('database-erd.pdf');
        this.classList.remove('loading');
      });
    });
    
    document.getElementById('exportJSON').addEventListener('click', function() {
      this.classList.add('loading');
      const dataStr = JSON.stringify(${JSON.stringify(dictionary)}, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const link = document.createElement('a');
      link.download = 'database-dictionary.json';
      link.href = URL.createObjectURL(dataBlob);
      link.click();
      this.classList.remove('loading');
    });
    
    // Initialize - expand first table by default
    if (tableCards.length > 0) {
      toggleTableContent(0);
    }
    
    // Add badge styles
    const style = document.createElement('style');
    style.textContent = \`
      .badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .badge-yes {
        background: #d4edda;
        color: #155724;
      }
      .badge-no {
        background: #f8d7da;
        color: #721c24;
      }
    \`;
    document.head.appendChild(style);
  </script>
</body>
</html>`;
}

export function generateMarkdownDictionary(
  dictionary: DatabaseDictionary,
): string {
  let md = `# Database Dictionary\\n\\n`;
  md += `**Database:** ${dictionary.database}  \\n`;
  md += `**Generated:** ${dictionary.generatedAt}  \\n`;
  md += `**Version:** ${dictionary.version}  \\n`;
  md += `**Total Tables:** ${dictionary.tables.length}  \\n\\n`;

  dictionary.tables.forEach((table) => {
    md += `## ${table.name}\\n\\n`;
    md += `**Columns:** ${table.columns.length}  \\n\\n`;

    if (table.relations && table.relations.length > 0) {
      md += `**Relationships:**\n`;
      table.relations.forEach((rel) => {
        md += `- ${rel.type}: ${rel.sourceColumn} → ${rel.targetTable}.${rel.targetColumn}\n`;
      });
      md += `\n`;
    }

    md += `| Column | Type | Nullable | Default | Constraints | Comment |\n`;
    md += `|--------|------|----------|---------|-------------|---------|\n`;

    table.columns.forEach((column) => {
      const constraints = [];
      if (column.isPrimary) constraints.push("PK");
      if (column.isUnique) constraints.push("Unique");
      if (column.isForeignKey) constraints.push("FK");

      md += `| ${column.name} | \`${column.type}${column.maxLength ? `(${column.maxLength})` : ""}\` | ${column.nullable ? "YES" : "NO"} | ${column.default || ""} | ${constraints.join(", ")} | ${column.comment || ""} |\n`;
    });

    md += `\n`;
  });

  return md;
}
