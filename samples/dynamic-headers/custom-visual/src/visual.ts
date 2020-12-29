"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import Tabulator from 'tabulator-tables';
import { VisualSettings } from "./settings";

export class Visual implements IVisual {
    private target: HTMLElement; 
    private settings: VisualSettings;
    private dynamic_table_html: HTMLElement;
    private error_message_html: HTMLElement;

    constructor(options: VisualConstructorOptions) {  
        this.target = options.element;
        
        if (document) {
            this.dynamic_table_html = document.createElement("div");
            this.dynamic_table_html.setAttribute("id", "dynamic-header-table");

            this.error_message_html = document.createElement("p"); 
            this.error_message_html.style.display = "none";

            this.target.appendChild(this.dynamic_table_html);
            this.target.appendChild(this.error_message_html);
        }
    }
 
    public update(options: VisualUpdateOptions) {
        var tableColumns = options.dataViews[0].table.columns;        
        var tableRows = options.dataViews[0].table.rows;

        // Rewrite columns index based on their order
        tableColumns.forEach( (tableColumn, index) =>  tableColumn.index = index );
        
        // Get all different data roles
        var staticColumnValues = tableColumns
            .filter(staticColumnValue => staticColumnValue.roles.static_column_values == true)
            .map(staticColumnValue => {
                return { 
                    index: staticColumnValue.index,
                    roleIndex: staticColumnValue['rolesIndex'].static_column_values[0], 
                    displayName: staticColumnValue.displayName
                }
            })
            .sort((a, b) => a.roleIndex - b.roleIndex);
        
        var dynamicColumnValues = tableColumns
            .filter(dynamicColumnValue => dynamicColumnValue.roles.dynamic_column_values == true)
            .map(dynamicColumnValue => {  
                return {
                    index: dynamicColumnValue.index,
                    roleIndex: dynamicColumnValue['rolesIndex'].dynamic_column_values[0], 
                    displayName: dynamicColumnValue.displayName
                } 
            })
            .sort((a, b) => a.roleIndex - b.roleIndex);

        var dynamicColumnHeaders = tableColumns
            .filter(dynamicColumnHeader => dynamicColumnHeader.roles.dynamic_column_headers == true)
            .map(dynamicColumnHeader => { 
                return { 
                    index: dynamicColumnHeader.index,
                    roleIndex: dynamicColumnHeader['rolesIndex'].dynamic_column_headers[0],
                } 
            })
            .sort((a, b) => a.roleIndex - b.roleIndex);

        // Validate common issues
        // Different number of fields dragged into the header and values roles
        if(dynamicColumnValues.length != dynamicColumnHeaders.length){
            this.error_message_html.innerHTML = "The number of Dynamic Header fields should be the same to the Dynamic Values fields";
            this.dynamic_table_html.style.display = "none";
            this.error_message_html.style.display = "block";
            return;
        }
        else{
            this.error_message_html.innerHTML = "";
            this.dynamic_table_html.style.display = "block";
            this.error_message_html.style.display = "none"; 
        }

        // Change title to dynamic title columns
        dynamicColumnValues = dynamicColumnValues
            .map( dynamicColumnValue => {
                let relateddynamicColumnHeader = dynamicColumnHeaders
                    .find( dynamicColumnHeader => dynamicColumnValue.roleIndex == dynamicColumnHeader.roleIndex );

                dynamicColumnValue.displayName = tableRows[0]?.[relateddynamicColumnHeader.index] as string;
                return dynamicColumnValue;
            })
            .filter(dynamicColumnValue => dynamicColumnValue.displayName);

        // Merge static and dynamic title columns
        let mergedColumns = staticColumnValues.concat(dynamicColumnValues);

        // Format table columns for tabulator
        let formattedColumns = mergedColumns.map(column => { return { title: column.displayName, field: column.index.toString() } });

        // Create tabulator table
        new Tabulator("#dynamic-header-table", {
            data: tableRows,
            height: "100%",
            layout:"fitColumns",  
            columns: formattedColumns
        });
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances( this.settings || VisualSettings.getDefault(), options );
    }
}