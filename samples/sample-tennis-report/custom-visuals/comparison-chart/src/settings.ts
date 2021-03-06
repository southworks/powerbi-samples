/*
 *  Power BI Visualizations
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

"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
    public multipliers: multipliersSettings = new multipliersSettings();
    public messages: messagesSettings = new messagesSettings();
    public styles: stylesSettings = new stylesSettings();
}

export class multipliersSettings {
    public multiplier: number = 1;
}

export class messagesSettings {
    public notRequiredSelectedOptionsMessage: string = "The visual needs 2 options selected.";
    public noMeasureMessage: string = "The visual needs at least one field in the Measures section.";
    public messageBackgroundColor: string = "#ffffff";
    public messageBorderColor: string = "#ff1c1c";
    public messageFontColor: string = "#ff1c1c";
    public textSize: number = 14;
}

export class stylesSettings {
    public headerFontSize: number = 14;
    public secFontSize: number = 14;
    public secTitleFontSize: number = 14;
    public leftBarColor: string = "#33b2ff";
    public rightBarColor: string = "#016cad";
    public chartBackgroundColor: string = "#ffffff00";
    public categoryBackgroundColor: string = "#ffffff00";
    public categorySeparatorColor: string = "#ffffff00";
    public headerFontColor: string = "#000000";
    public categoryFontColor: string = "#000000";
    public metricFontColor: string = "#000000";
    public showMetricValue: boolean = true;
    public showHeader: boolean = true;
}

