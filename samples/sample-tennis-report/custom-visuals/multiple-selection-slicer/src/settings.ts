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
  public selections: SelectionsSettings = new SelectionsSettings();
  public style: StyleSettings = new StyleSettings();
}

export class SelectionsSettings {
  public maximumCount: number = 2;
  public minimumCount: number = 1;
  public optionsListCount: number = 5;
}

export class StyleSettings {
  public fontColor: string = "#666";
  public fontSize: number = 14;

  public searchInputBorderColor: string = "#666";
  public searchBackgroundColor: string = "#fff";
  public searchFontColor: string = "#666";

  public selectedBackgroundColor: string = "#efefef";
  public selectedFontColor: string = "#666";
  public selectedShadowColor: string = "rgb(216 212 212)";
  public selectedStyle: string = "side-by-side";
  public selectedCrossBackgroundColor: string = "#d7d7d7";

  public optionsBackgroundColor: string = "#fff";
  public optionsStripeColor: string = "#efefef";
  public optionsFontColor: string = "#666";

}



