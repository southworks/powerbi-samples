import powerbi from 'powerbi-visuals-api';
import { VisualSettings } from './settings';
import IColorPalette = powerbi.extensibility.IColorPalette;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

export class TabulatorFormatter {
    public columns: Header[];
    public rows: any;
    private colorPalette: IColorPalette;
    public settings: VisualSettings;

    constructor(
        columns: powerbi.DataViewMetadataColumn[],
        rows: powerbi.DataViewTableRow[],
        colorPalette: IColorPalette,
        settings: VisualSettings
    ) {
        this.settings = settings;
        this.columns = this.headerBuilder(columns, this.titleFormatter);
        this.rows = this.rowBuilder(rows, columns);
        this.colorPalette = colorPalette;
    }
    
    private headerBuilder(
        columns: powerbi.DataViewMetadataColumn[],
        titleFormatter?: (
            cell: any,
            formatterParams: any,
            onRendered: any
        ) => any
    ): Header[] {
        let headers = new Array();
        columns.forEach((column) => {
            let headerElement = new Header(
                column.displayName,
                column.displayName,
                titleFormatter,
            );
            headers.push(headerElement);
        });
        return headers;
    }

    private rowBuilder(
        rows: powerbi.DataViewTableRow[],
        columns: powerbi.DataViewMetadataColumn[]
    ): any {
        let tabulatorRows = new Array();
        rows.forEach((row) => {
            let tableRow = {};
            columns.forEach((column) => {
                tableRow[column.displayName] = row[column.index];
            });
            tabulatorRows.push(tableRow);
        });
        return tabulatorRows;
    }

    public customRowFormatter = (row) => {
        let rowElementStyle = row.getElement().style;
        rowElementStyle.backgroundColor = this.settings.dataTable.rowBackgroundColor;
        rowElementStyle.fontSize = this.settings.dataTable.fontSize + 'px';
    };

    public titleFormatter = (cell, formatterParams, onRendered): any => {
        cell.getElement().style.fontSize = this.settings.dataTable.fontSize + 'px';
        cell.getElement().style.backgroundColor = this.settings.dataTable.headerBackgroundColor;
        return cell.getValue();
    };
    
}
class Header {
    title: string;
    field: string;
    titleFormatter?: (cell: any, formatterParams: any, onRendered: any) => any;
    
    constructor(
        title: string,
        field: string,
        titleFormatter?: (
            cell: any,
            formatterParams: any,
            onRendered: any
        ) => any,   
    ) {
        this.title = title;
        this.field = field;
        this.titleFormatter = titleFormatter;
    }
}
