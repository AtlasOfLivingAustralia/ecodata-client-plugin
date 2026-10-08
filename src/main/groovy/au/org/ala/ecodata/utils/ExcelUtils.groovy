package au.org.ala.ecodata.utils

import com.fasterxml.jackson.databind.MappingIterator
import com.fasterxml.jackson.dataformat.csv.CsvMapper
import com.fasterxml.jackson.dataformat.csv.CsvSchema
import org.apache.poi.ss.usermodel.*
import org.apache.poi.ss.util.CellReference

/**
 * Utility methods for working with Excel and CSV files
 * Replaces the ExcelImportService from the discontinued excel-import plugin, which was based on Apache POI.
 */
class ExcelUtils {

    static List<Map<String, String>> readCsvToListOfMaps(InputStreamReader csvReader) throws Exception {
        CsvMapper mapper = new CsvMapper()
        // Use the first row as the header
        CsvSchema schema = CsvSchema.emptySchema().withHeader()

        try (MappingIterator<Map<String, String>> it = mapper.readerFor(Map.class)
                .with(schema)
                .readValues(csvReader)) {
            return it.readAll()
        }
    }

    /**
     * Reads rows from a spreadsheet using a column letter to property name mapping.
     * Inlined Apache POI replacement for the discontinued excel-import plugin's
     * ExcelImportService.convertColumnMapConfigManyRows.
     *
     * @param workbook the workbook to read
     * @param config map with keys: sheet (sheet name), startRow (0-based first data row),
     *        columnMap (column letter -> property name)
     * @return a List of Maps, one per non-empty row, keyed by property name
     */
    static List convertColumnMapManyRows(Workbook workbook, Map config) {
        Sheet sheet = workbook.getSheet(config.sheet as String)
        if (sheet == null) {
            return []
        }
        int startRow = config.startRow as int
        Map columnMap = config.columnMap
        DataFormatter dataFormatter = new DataFormatter()
        List rows = []
        for (int i = startRow; i <= sheet.lastRowNum; i++) {
            Row row = sheet.getRow(i)
            if (row == null) {
                continue
            }
            Map rowData = [:]
            boolean hasValue = false
            columnMap.each { String columnLetter, String propertyName ->
                Cell cell = row.getCell(CellReference.convertColStringToIndex(columnLetter))
                def value = cellValue(cell, dataFormatter)
                if (value != null && value != '') {
                    hasValue = true
                }
                rowData[propertyName] = value
            }
            if (hasValue) {
                rows << rowData
            }
        }
        rows
    }

    private static Object cellValue(Cell cell, DataFormatter dataFormatter) {
        if (cell == null) {
            return null
        }
        CellType type = cell.cellType == CellType.FORMULA ? cell.cachedFormulaResultType : cell.cellType
        switch (type) {
            case CellType.NUMERIC:
                return DateUtil.isCellDateFormatted(cell) ? cell.dateCellValue : cell.numericCellValue
            case CellType.BOOLEAN:
                return cell.booleanCellValue
            case CellType.STRING:
                return cell.stringCellValue?.trim()
            case CellType.BLANK:
                return null
            case CellType.ERROR:
                return null
            default:
                return dataFormatter.formatCellValue(cell)?.trim()
        }
    }
}