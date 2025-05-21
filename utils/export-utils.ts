/**
 * Utility functions for exporting data in different formats
 */

// Helper to convert data to CSV format
export function convertToCSV(data: any[], headers?: string[]) {
  if (!data || !data.length) return ""

  // If headers are not provided, use the keys of the first object
  const columnHeaders = headers || Object.keys(data[0])

  // Create header row
  let csvContent = columnHeaders.join(",") + "\n"

  // Add data rows
  data.forEach((item) => {
    const row = columnHeaders
      .map((header) => {
        // Handle values that might contain commas or quotes
        const value = item[header] !== undefined ? item[header] : ""
        const valueStr = String(value)
        return valueStr.includes(",") || valueStr.includes('"') ? `"${valueStr.replace(/"/g, '""')}"` : valueStr
      })
      .join(",")
    csvContent += row + "\n"
  })

  return csvContent
}

// Helper to download data as a file
export function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

// Export data as CSV
export function exportAsCSV(data: any[], fileName: string, headers?: string[]) {
  const csvContent = convertToCSV(data, headers)
  downloadFile(csvContent, `${fileName}.csv`, "text/csv;charset=utf-8;")
}

// Export data as Excel (simplified - in a real app, you'd use a library like xlsx)
export function exportAsExcel(data: any[], fileName: string) {
  // For this demo, we'll convert to CSV and change the extension
  // In a real app, you would use a library like xlsx to create a proper Excel file
  const csvContent = convertToCSV(data)
  downloadFile(csvContent, `${fileName}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}

// Export data as PDF (simplified - in a real app, you'd use a library like jsPDF)
export function exportAsPDF(data: any[], fileName: string, title: string) {
  // For this demo, we'll create a simple HTML representation and convert it to a text file
  // In a real app, you would use a library like jsPDF to create a proper PDF file
  let content = `<h1>${title}</h1>\n<table>\n`

  // Add header row
  const headers = Object.keys(data[0])
  content += "<tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr>\n"

  // Add data rows
  data.forEach((item) => {
    content += "<tr>" + headers.map((h) => `<td>${item[h]}</td>`).join("") + "</tr>\n"
  })

  content += "</table>"

  // In a real app, you would convert this HTML to PDF
  // For this demo, we'll just download it as a text file
  downloadFile(content, `${fileName}.pdf`, "application/pdf")
}

// Format data for export based on section
export function formatDataForExport(data: any[], section: string) {
  // Format data based on the section
  switch (section) {
    case "ahorros":
      return data.map((item) => ({
        Nombre: item.nombre || item.name,
        Tipo: item.tipo,
        "Fecha Inicio": item.fecha,
        Monto: `$${item.monto?.toLocaleString()}`,
        Descripción: item.descripcion || "",
      }))

    case "objetivos":
      return data.map((item) => ({
        Nombre: item.nombre || item.name,
        Descripción: item.descripcion,
        "Monto Actual": `$${item.actual?.toLocaleString()}`,
        "Monto Objetivo": `$${item.objetivo?.toLocaleString()}`,
        "Progreso (%)": `${item.porcentaje}%`,
        "Fecha Inicio": item.fechaInicio,
        "Fecha Fin": item.fechaFin,
        "Fecha Completado": item.fechaCompletado || "N/A",
      }))

    case "ingresos-gastos":
      return data.map((item) => ({
        Tipo: item.tipo,
        Concepto: item.concepto,
        Categoría: item.categoria,
        Fecha: item.fecha,
        Monto: `$${item.monto?.toLocaleString()}`,
      }))

    default:
      return data
  }
}
