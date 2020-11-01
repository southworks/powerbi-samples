/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
'use strict';

import 'core-js/stable';
import './../style/visual.less';
import powerbi from 'powerbi-visuals-api';
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IColorPalette = powerbi.extensibility.IColorPalette;
import { TabulatorFormatter } from './tabulator-formatter';
import { VisualSettings } from './settings';
import Tabulator from 'tabulator-tables';

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private colorPalette: IColorPalette;
    private errorMessageHTML: HTMLElement;
    private dataViews : powerbi.DataView[]

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;

        if (document) {
            this.target = document.createElement('div');
            this.target.setAttribute('id', 'dynamicTable');

            this.errorMessageHTML = document.createElement("p"); 
            this.errorMessageHTML.style.display = "none";

            this.colorPalette = options.host.colorPalette;
            options.element.appendChild(this.target);
            options.element.appendChild(this.errorMessageHTML);
        }
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(
            options && options.dataViews && options.dataViews[0]
        );
        
        /** Test 1: Data view has valid bare-minimum entries */
        this.dataViews = options.dataViews;

        if (
            !this.dataViews ||
            !this.dataViews[0] ||
            !this.dataViews[0].table ||
            !this.dataViews[0].table.rows ||
            !this.dataViews[0].table.columns ||
            !this.dataViews[0].metadata
        ) {
            this.errorMessageHTML.innerHTML = "Please drag an element into the values field";
            this.target.style.display = "none";
            this.errorMessageHTML.style.display = "block";
            return;
        }
        
        if(this.settings.dataTable.headerBackgroundColor === null){
            this.settings.dataTable.headerBackgroundColor = this.getTopColorFromPalette()
        }
        /** If we get this far, we can trust that we can work with the data! */
        let table = this.dataViews[0].table;

        //Modify Custom CSS Style
        this.modifyStyleSheet(document, this.settings);

        let tabulatorFormatter = new TabulatorFormatter(
            table.columns,
            table.rows,
            this.colorPalette,
            this.settings
        );

        new Tabulator('#dynamicTable', {
            height: 350,
            layout: 'fitColumns',
            data: tabulatorFormatter.rows,
            columns: tabulatorFormatter.columns,
            rowFormatter: tabulatorFormatter.customRowFormatter,
        });
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return <VisualSettings>VisualSettings.parse(dataView);
    }
    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(
        options: EnumerateVisualObjectInstancesOptions
    ): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(
            this.settings || VisualSettings.getDefault(),
            options
        );
    }

    private modifyStyleSheet(document: Document, settings: VisualSettings) {
        let sheet = document.createElement('style');
        sheet.innerHTML = `.tabulator .tabulator-header { border-bottom: ${settings.dataTable.borderBottomWidth} ${settings.dataTable.borderBottomStyle} ${settings.dataTable.borderBottomColor};}`;
        document.body.appendChild(sheet);
    }
    private getTopColorFromPalette(): string{
        return this.colorPalette.getColor('1').value
    }
}
