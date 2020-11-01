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
        var staticTitleColumns = tableColumns
            .filter(staticTitleColumn => staticTitleColumn.roles.static_title_columns == true)
            .map(staticTitleColumn => {
                return { 
                    index: staticTitleColumn.index,
                    roleIndex: staticTitleColumn['rolesIndex'].static_title_columns[0], 
                    displayName: staticTitleColumn.displayName
                }
            })
            .sort((a, b) => a.roleIndex - b.roleIndex);
        
        var dynamicTitleColumns = tableColumns
            .filter(dynamicTitleColumn => dynamicTitleColumn.roles.dynamic_title_columns == true)
            .map(dynamicTitleColumn => {  
                return {
                    index: dynamicTitleColumn.index,
                    roleIndex: dynamicTitleColumn['rolesIndex'].dynamic_title_columns[0], 
                    displayName: dynamicTitleColumn.displayName
                } 
            })
            .sort((a, b) => a.roleIndex - b.roleIndex);

        var dynamicHeaderTitles = tableColumns
            .filter(dynamicHeaderTitle => dynamicHeaderTitle.roles.dynamic_header_titles == true)
            .map(dynamicHeaderTitle => { 
                return { 
                    index: dynamicHeaderTitle.index,
                    roleIndex: dynamicHeaderTitle['rolesIndex'].dynamic_header_titles[0],
                } 
            })
            .sort((a, b) => a.roleIndex - b.roleIndex);

        // Validate common issues
        // Different number of fields dragged into the header and values roles
        if(dynamicTitleColumns.length != dynamicHeaderTitles.length){
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
        dynamicTitleColumns = dynamicTitleColumns
            .map( (dynamicTitleColumn ) => {
                let relatedDynamicHeaderTitle = dynamicHeaderTitles
                    .find( dynamicHeaderTitle => dynamicTitleColumn.roleIndex == dynamicHeaderTitle.roleIndex );

                dynamicTitleColumn.displayName = tableRows[0]?.[relatedDynamicHeaderTitle.index] as string;
                return dynamicTitleColumn;
            })
            .filter(dynamicTitleColumn => dynamicTitleColumn.displayName);

        // Merge static and dynamic title columns
        let mergedColumns = staticTitleColumns.concat(dynamicTitleColumns);

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