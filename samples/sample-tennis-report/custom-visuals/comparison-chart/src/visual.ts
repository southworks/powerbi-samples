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
"use strict";

import "core-js/stable";
import "./../style/visual.less";
import { VisualSettings } from "./settings";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { createTooltipServiceWrapper, TooltipEventArgs, ITooltipServiceWrapper, TooltipEnabledDataPoint } from "powerbi-visuals-utils-tooltiputils";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IColorPalette = powerbi.extensibility.IColorPalette;
import * as d3 from "d3";


export interface chartMetric {
    Player: string;
    Metric: number;
    MetricName: string;
    MetricToShow: string
}

export interface style {
    BackgroundColor: string;
    FontColor: string;
    FontSize: number;
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private dataView: DataView;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private colorPalette: IColorPalette;

    constructor(options: VisualConstructorOptions) {
        this.target = document.createElement("div");
        this.target.style.overflow = 'hidden';
        this.target.style.height = '100%';
        options.element.appendChild(this.target);
        this.tooltipServiceWrapper = createTooltipServiceWrapper(options.host.tooltipService, options.element);
        this.colorPalette = options.host.colorPalette;
    }

    public update(options: VisualUpdateOptions) {
        // Remove all child elements from target
        this.target.innerHTML = '';
        this.dataView = options.dataViews[0];
        this.settings = VisualSettings.parse<VisualSettings>(this.dataView);

        // Rollback the automatic reset
        this.colorPalette['colorIndex'] = Object.keys(this.colorPalette['colorPalette']).length;

        if (!options ||
            !options.dataViews ||
            !options.dataViews[0] ||
            !options.dataViews[0].table ||
            !options.dataViews[0].table.columns) {
            return;
        }

        this.initialize(options);
    }

    // Init method
    public initialize(options: VisualUpdateOptions) {
        let rows = options.dataViews[0].table.rows;
        let cols = options.dataViews[0].table.columns;
        var _this = this;

        // Create an SVG element and append to the curren row
        let addChartToRow = function (row: HTMLTableRowElement, inverted: boolean, data: chartMetric[], barColor: string) {
            let cell = row.insertCell();
            cell.className = "bar";
            let svg = d3.select(cell).append('svg');
            let chartWidth = 100;

            // Set svg style properties
            svg.attr("style", "display: block;");
            svg.attr("width", "100%");
            svg.attr("height", "5");

            let xMax = d3.max(data, function (d) {
                return d.Metric;
            });

            let yScale = d3.scaleBand().domain(data.map(function (d) { return d.Player; })).rangeRound([0, 5]).padding(0);
            let xScale = d3.scaleLinear().domain([0, xMax]);

            // Change the range mix/max values when the bar is right to left or viceversa
            if (inverted)
                xScale.range([chartWidth, 0]);
            else
                xScale.range([0, chartWidth]);

            // Remove exsisting axis and bar
            svg.selectAll('.axis').remove();
            svg.selectAll('.bar').remove();

            // Add tooltip data information
            svg.classed("visual", true)
                .data([{
                    tooltipInfo: [{
                        header: data[0].MetricName + ": " + data[0].MetricToShow
                    }]
                }]);

            // Select all bar charts and configure size and color
            let shapes = svg.selectAll('.bar').data(data);
            shapes.enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('fill', barColor)
                .attr('stroke-width', '0')
                .attr('height', '5')
                .attr('x', function (d) {
                    return inverted ? (100 - d.Metric) : 0;
                })
                .attr('y', function (d) {
                    return yScale(d.Player);
                })
                .attr('width', function (d) {
                    return d.Metric;
                }).data([{
                    tooltipInfo: [{
                        header: data[0].MetricName + ": " + data[0].MetricToShow
                    }]
                }]);

            shapes.exit().remove();

            // Add tooltip event to svg element
            _this.tooltipServiceWrapper.addTooltip<TooltipEnabledDataPoint>(svg, (eventArgs: TooltipEventArgs<TooltipEnabledDataPoint>) => {
                return eventArgs.data.tooltipInfo;
            });
        }

        // Add a chart to the row
        let calculateChartValue = function (columnIndex: number, value: number, name: string, columnFormat: string, maxValue: number): chartMetric[] {
            let array: chartMetric[] = [];
            let columnSettings = options.dataViews[0].metadata.columns[columnIndex].objects;
            let adjustedValue = columnFormat != undefined && columnFormat.indexOf('%') > -1 ? value * 100 : (value * 100) / maxValue;
            let valFormatter = valueFormatter.create({ format: columnFormat });
            let valueToShow = columnFormat == undefined ? value.toString() : valFormatter.format(value);

            if (columnSettings != undefined) {
                adjustedValue = adjustedValue * Number(columnSettings.multipliers.multiplier);
            }

            array.push({
                Metric: adjustedValue,
                Player: name,
                MetricName: options.dataViews[0].metadata.columns[columnIndex].displayName,
                MetricToShow: valueToShow
            });
            return array;
        }

        // Create span element with error details
        let createSpanElem = function (message: string): HTMLSpanElement {
            let spanElem = document.createElement('span');
            spanElem.innerText = message;
            spanElem.className = "error";
            spanElem.style.backgroundColor = _this.settings.messages.messageBackgroundColor;
            spanElem.style.fontSize = _this.settings.messages.textSize.toString() + "px";
            spanElem.style.color = _this.settings.messages.messageFontColor;
            spanElem.style.borderColor = _this.settings.messages.messageBorderColor;
            return spanElem;
        }

        // Resize all elements based on the visual´s height/width
        let resizeChartElements = function () {
            let tdHeight = (<HTMLElement>document.querySelector(".category-column")).offsetHeight;
            let tdWidth = (<HTMLElement>document.querySelector(".bar")).offsetWidth;
            let barElems = document.querySelectorAll(".bar");
            barElems.forEach(function (bar) {
                let svg = bar.parentElement;
                let barWidth = Number(bar.getAttribute("width"));
                let barX = Number(bar.getAttribute("x"));
                let newWidth = barWidth * tdWidth / 100;
                let newX = 0;

                if (barX != 0) {
                    newX = tdWidth - newWidth;
                }

                // Set svg's height
                svg.setAttribute("height", tdHeight.toString());
                // Set bar's height, width and x positon
                bar.setAttribute("height", tdHeight.toString());
                bar.setAttribute("width", newWidth.toString());
                bar.setAttribute("x", newX.toString());
            });
        }

        let player1 = rows[0];
        let player2 = rows[1];

        // Add table header
        let addHeaderToTable = function (tableElem: HTMLTableElement) {
            let headerElem = tableElem.createTHead();
            let headerRow = headerElem.insertRow();

            let addThElement = function (value: string, columnSpan: number) {
                let thElem = document.createElement("th");
                let textNode = document.createTextNode(value);

                thElem.colSpan = columnSpan;
                thElem.className = "title-row";
                thElem.style.color = _this.settings.styles.headerFontColor;
                thElem.style.fontSize = _this.settings.styles.headerFontSize.toString() + "px";
                thElem.style.backgroundColor = "00ffffff";
                thElem.appendChild(textNode);
                headerRow.appendChild(thElem);
            }

            addThElement(player1[cols.findIndex(column => column.roles.Category)].toString(), 2);
            addThElement("", 1);
            addThElement(player2[cols.findIndex(column => column.roles.Category)].toString(), 2);
        }

        // Add a new cell to the row (metrics, categories, titles)
        let addCellToRow = function (row: HTMLTableRowElement, value: string = '', className: string = '', columnSpan: number = 1, style: style = null) {
            let cell = row.insertCell();
            // Set cell attributes and inner text
            cell.colSpan = columnSpan;
            cell.className = className;
            cell.innerText = value;
            if (style != null) {
                cell.style.backgroundColor = style.BackgroundColor;
                cell.style.fontSize = style.FontSize.toString() + "px";
                cell.style.color = style.FontColor;
            }
            if (className == "category-column") {
                cell.style.borderTopColor = _this.settings.styles.categorySeparatorColor;
                cell.style.borderBottomColor = _this.settings.styles.categorySeparatorColor;
            }
        }

        // Add column group to table and apply style for metric columns
        let addGroupToTable = function (table: HTMLTableElement) {
            let groupElem = document.createElement('colgroup');

            for (let column = 0; column < 5; column++) {
                let colElem = document.createElement('col');
                if (column == 0 ||
                    column == 4) {
                    colElem.className = "metric-column";
                }
                groupElem.appendChild(colElem);
            }

            table.appendChild(groupElem);
        }

        // Validates that two player were selected and at least one measure is added to the visual
        if (rows.length == 2) {
            // Set bars color using the current theme
            this.settings.styles.leftBarColor = this.dataView.metadata.objects?.styles.leftBarColor != undefined ? this.dataView.metadata.objects.styles.leftBarColor["solid"].color : this.colorPalette.getColor(player1[cols.findIndex(column => column.roles.Category)].toString()).value;
            this.settings.styles.rightBarColor = this.dataView.metadata.objects?.styles.rightBarColor != undefined ? this.dataView.metadata.objects.styles.rightBarColor["solid"].color : this.colorPalette.getColor(player2[cols.findIndex(column => column.roles.Category)].toString()).value;

            if (cols.filter(column => !column.roles.Category).length > 0) {
                // Create table element
                let tableElem = document.createElement('table');
                tableElem.style.backgroundColor = _this.settings.styles.chartBackgroundColor;
                addGroupToTable(tableElem);
                // Get max value from all metrics
                let maxValue = Math.max(
                    Math.max.apply(Math, player1.slice(1, player1.length).map(function (value) { return value; })),
                    Math.max.apply(Math, player2.slice(1, player2.length).map(function (value) { return value; }))
                );
                cols.forEach(function (col) {
                    if (!cols[col.index].roles.Category) {
                        // Insert measure row
                        let playerOneFormat = _this.getColumnFormatValue(player1[col.index]);
                        let playerTwoFormat = _this.getColumnFormatValue(player2[col.index]);
                        let formatValue = _this.defineFormatValue(playerOneFormat, playerTwoFormat);
                        let columnFormat = _this.getColumnFormat(options.dataViews[0].metadata.columns[col.index].format, formatValue)

                        // Format the number and set the unit of measurement: K, M, Bn, T
                        let valFormatter = valueFormatter.create({ format: columnFormat, value: formatValue });
                        let measurePlayer1 = columnFormat == undefined ? player1[col.index].toString() : _this.formatMeasureValue(player1[col.index], valFormatter);
                        let measurePlayer2 = columnFormat == undefined ? player2[col.index].toString() : _this.formatMeasureValue(player2[col.index], valFormatter);
                        // Add a new cell for each column (measure1, bar1, measure name, bar2, measure2)
                        let rowElem = tableElem.insertRow();
                        addCellToRow(rowElem, _this.settings.styles.showMetricValue ? measurePlayer1 : "", "metric-column", 1, {
                            FontColor: _this.settings.styles.metricFontColor,
                            FontSize: _this.settings.styles.secTitleFontSize,
                            BackgroundColor: '00ffffff'
                        });
                        addChartToRow(rowElem, true, calculateChartValue(col.index, Number(player1[col.index]), player1[0].toString(), columnFormat, maxValue), _this.settings.styles.leftBarColor);
                        addCellToRow(rowElem, col.displayName, "category-column", 1, {
                            FontColor: _this.settings.styles.categoryFontColor,
                            FontSize: _this.settings.styles.secFontSize,
                            BackgroundColor: _this.settings.styles.categoryBackgroundColor
                        });
                        addChartToRow(rowElem, false, calculateChartValue(col.index, Number(player2[col.index]), player2[0].toString(), columnFormat, maxValue), _this.settings.styles.rightBarColor);
                        addCellToRow(rowElem, _this.settings.styles.showMetricValue ? measurePlayer2 : "", "metric-column", 1, {
                            FontColor: _this.settings.styles.metricFontColor,
                            FontSize: _this.settings.styles.secTitleFontSize,
                            BackgroundColor: '00ffffff'
                        });

                    }
                });

                if (this.settings.styles.showHeader) {
                    addHeaderToTable(tableElem);
                }
                // Append table to div container
                this.target.appendChild(tableElem);
                resizeChartElements();
            }
            else {
                // Show a message when no measures were configured
                this.target.appendChild(createSpanElem(this.settings.messages.noMeasureMessage));
            }
        }
        else {
            // Show a message when the selected options (slicer) are fewer than expected
            this.target.appendChild(createSpanElem(this.settings.messages.notRequiredSelectedOptionsMessage));
        }
    }

    // Get value from settings collection
    public getValue<T>(objects: powerbi.DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
        if (objects) {
            let object = objects[objectName];
            if (object) {
                let property: T = <T>object[propertyName];
                if (property !== undefined) {
                    return property;
                }
            }
        }
        return defaultValue;
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        let objectName = options.objectName;
        let objectEnumeration: VisualObjectInstance[] = [];

        let metadataColumns: powerbi.DataViewMetadataColumn[] = this.dataView.metadata.columns;
        switch (objectName) {
            // Settings for multipliers values for each column
            case 'multipliers':
                for (let i = 0; i < metadataColumns.length; i++) {
                    if (!metadataColumns[i].roles.Category) {
                        let currentColumn: powerbi.DataViewMetadataColumn = metadataColumns[i];
                        objectEnumeration.push({
                            objectName: objectName,
                            displayName: currentColumn.displayName,
                            properties: {
                                multiplier: this.getValue<number>(currentColumn.objects, objectName, "multiplier", 1)
                            },
                            selector: { metadata: currentColumn.queryName },
                            validValues: {
                                values: {
                                    numberRange: {
                                        min: 1,
                                        max: 10
                                    }
                                }
                            }
                        });
                    }
                };
                break;
        }

        return objectEnumeration.length == 0 ? VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options) : objectEnumeration;
    }

    public getColumnFormat(value: string, formatValue: string | number) {
        let columnFormat = value;
        if (columnFormat == undefined && formatValue != "") {
            columnFormat = "0";
        }

        return columnFormat
    }

    public getColumnFormatValue(value: powerbi.PrimitiveValue): string | number {
        let formatValue;
        if (typeof (value) != "number" || value < 1000) {
            formatValue = ""
        } else if (value < 999999) {
            formatValue = 1001;
        } else if (value < 999999999) {
            formatValue = 1e6;
        } else if (value < 999999999999) {
            formatValue = 1e9;
        } else {
            formatValue = 1e12;
        }

        return formatValue;
    }

    public defineFormatValue(playerOne: string | number, playerTwo: string | number): string | number {
        let format;
        if (typeof (playerOne) != typeof (playerTwo)) {
            format = "";
        } else if (playerOne == playerTwo) {
            format = playerOne;
        } else {
            const formats = [1001, 1e6, 1e9, 1e12];
            const playerOneIndex = formats.findIndex(f => f == playerOne);
            const playerTwoIndex = formats.findIndex(f => f == playerTwo);
            const diff = Math.abs(playerOneIndex - playerTwoIndex);
            const minIndex = Math.min(playerOneIndex, playerTwoIndex);
            const sumIndex = playerOneIndex + playerTwoIndex;
            if (diff == 1) {
                format = formats[minIndex];
            } else if (diff == 2) {
                format = formats[sumIndex / 2];
            } else {
                format = formats[minIndex + 1];
            }
        }

        return format;
    }

    public formatMeasureValue(value: powerbi.PrimitiveValue, valFormatter: valueFormatter.IValueFormatter): string {
        let formattedValue = valFormatter.format(value)
        let returnValue = "";
        let regexDecimal = /^(\d*[\.\,]\d*)(\w*)/;
        let regexScientific = /E\+/;
        if (regexScientific.test(formattedValue)) {
            returnValue = formattedValue;
        } else {
            let results = formattedValue.match(regexDecimal);
            // If the text does not match with the text return the formatted value unaltered
            if (results == null) {
                returnValue = formattedValue;
            } else {
                let numericValue = parseFloat(results[1].replace(",", ".")).toFixed(2);
                returnValue = numericValue.toString().concat(results[2]);
            }
        }

        return returnValue;
    }
}
