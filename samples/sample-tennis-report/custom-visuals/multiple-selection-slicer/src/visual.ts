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
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import VisualUpdateType = powerbi.VisualUpdateType;

import * as models from 'powerbi-models';

import { VisualSettings } from "./settings";
export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private selectedValues = [];
    private host: IVisualHost;
    private isEventUpdate: boolean = false;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
    }

    @logExceptions()
    public update(options: VisualUpdateOptions) {
        this.settings = VisualSettings.parse<VisualSettings>(options.dataViews[0]);

        if (options.type & VisualUpdateType.Data && !this.isEventUpdate) {
            this.init(options);
        }
    }

    @logExceptions()
    public init(options: VisualUpdateOptions) {
        // Return if we don't have a category
        if (!options ||
            !options.dataViews ||
            !options.dataViews[0] ||
            !options.dataViews[0].categorical ||
            !options.dataViews[0].categorical.categories ||
            !options.dataViews[0].categorical.categories[0]) {
            return;
        }

        // Remove any children from previous renders
        while (this.target.firstChild) {
            this.target.removeChild(this.target.firstChild);
        }

        var that = this;

        // Get the category data.
        let category = options.dataViews[0].categorical.categories[0];
        let values = category.values;

        // Initialize the filters
        let filterTarget: models.IFilterColumnTarget = {
            table: category.source.queryName.substr(0, category.source.queryName.indexOf('.')),
            column: category.source.displayName
        };

        // If the visual is refreshed/restarted with filters applied, create the elements
        options.jsonFilters.forEach(function(obj) {
            let filter = obj as models.BasicFilter;
            let target = filter.target as models.IFilterColumnTarget;
            if (target.column == filterTarget.column && target.table == filterTarget.table) {
                that.selectedValues.push(...filter.values.filter(function(aux) {
                    return that.selectedValues.indexOf(aux) == -1;
                }));
            }
        });

        // Update the selected values list
        let fnUpdateSelectedList = function() {
            let list = document.querySelector(".selected-list");
            list.innerHTML = ''; // Remove all child elements

            let input = (<HTMLInputElement> document.querySelector(".search-input"));
            that.selectedValues.forEach(function(item) {
                let el = document.createElement("li");
                el.innerHTML = item.toString();
                el.dataset.value = item.toString();
                el.style.backgroundColor = that.settings.style.selectedBackgroundColor;
                el.style.color = that.settings.style.selectedFontColor;
                el.style.boxShadow = that.settings.style.selectedShadowColor +  " 1px 1px 1px 0px";
                el.classList.add(that.settings.style.selectedStyle); // add the CSS class that will define if the list will be shown side-by-side or as a list

                // add a cross
                let cross = document.createElement("span");
                cross.classList.add("cross");
                cross.style.backgroundColor = that.settings.style.selectedCrossBackgroundColor;
                el.appendChild(cross);

                el.addEventListener('click', function() {
                    that.selectedValues = that.selectedValues.filter(function(aux) {
                        return aux != item;
                    });
                    fnUpdateSelectedList();
                    fnUpdateFilters();

                    if (that.selectedValues.length < that.settings.selections.maximumCount) {
                        input.disabled = false;
                        input.placeholder = "Search..";
                    }

                },false);
                list.appendChild(el);
            });

            if (that.selectedValues.length >= that.settings.selections.maximumCount) {
                input.disabled = true;
                input.placeholder = "Maximum number of options selected";
            }
        }

        // Applies the selected filters
        let fnUpdateFilters = function() {
            that.isEventUpdate = true;
            if (that.selectedValues.length == 0) {
                that.host.applyJsonFilter(null, "general", "filter", powerbi.FilterAction.remove);
            } else {
                if (that.selectedValues.length >= that.settings.selections.minimumCount) {
                    let filter = new models.BasicFilter(filterTarget, "In", that.selectedValues);
                    that.host.applyJsonFilter(filter, "general", "filter", powerbi.FilterAction.merge);
                } else {
                    that.host.applyJsonFilter(null, "general", "filter", powerbi.FilterAction.remove);
                }
                that.isEventUpdate = false;
            }
        }

        // Create the floating options list
        let fnCreateOptionsList = function(filterText) {
            let container = document.querySelector(".search-container");

            // Remove the old DOM element (if exists)
            fnRemoveOptionsList();

            let list = document.createElement("ul");
            list.classList.add("options-list");
            list.style.backgroundColor = that.settings.style.optionsBackgroundColor;
            list.style.top = (document.querySelector(".search-input") as HTMLElement).offsetHeight + "px";

            // Get the first N records matching the conditions
            let arr = values.filter(function(item) {
                return ((!filterText || item.toString().toLowerCase().indexOf(filterText) != -1) && that.selectedValues.indexOf(item.toString()) == -1);
            }).slice(0, that.settings.selections.optionsListCount);

            arr.forEach((item: number, index: number) => {
                var listElement = document.createElement("li")
                listElement.dataset.value = item.toString();
                listElement.innerHTML = item.toString();
                listElement.addEventListener('click', function(ev) {
                    let element = ev.target as HTMLElement;
                    that.selectedValues.push(element.dataset.value);
                    fnRemoveOptionsList(); // Close the list
                    fnUpdateSelectedList();  // Update the selected items list
                    fnUpdateFilters(); // Update the filters
                    let input = (<HTMLInputElement> document.querySelector(".search-input"));
                    input.value = null;
                    if (that.selectedValues.length == that.settings.selections.maximumCount) {
                        input.disabled = true;
                        input.placeholder = "Maximum number of options selected";
                    }
                }, false);

                listElement.style.fontSize = that.settings.style.fontSize + "px";
                listElement.style.color = that.settings.style.optionsFontColor;

                // Add the stripe
                if (index % 2 == 0) {
                    listElement.style.backgroundColor = that.settings.style.optionsStripeColor;
                }

                list.append(listElement);
            });
            container.appendChild(list);
        }

        // Remove the floating options list
        let fnRemoveOptionsList = function() {
            var el = document.querySelector("ul.options-list");
            if (el) {
                el.remove();
            }
        }

        // Configure the base DOM node
        let container = document.createElement("div");
        container.classList.add("search-container");
        container.style.fontSize = this.settings.style.fontSize + "px";
        container.style.color = this.settings.style.fontColor;

        // Search input
        let input = document.createElement("input");
        input.classList.add("search-input");
        input.autocomplete = "off";
        input.type = "text";
        input.name = "search";
        input.placeholder = "Search..";
        input.style.fontSize = this.settings.style.fontSize + "px";
        input.style.backgroundColor = this.settings.style.searchBackgroundColor;
        input.style.color = this.settings.style.searchFontColor;
        input.style.borderColor = this.settings.style.searchInputBorderColor;

        input.onfocus = function(e) {
            fnCreateOptionsList(undefined);
            (e.target as HTMLTextAreaElement).value = null;
        }
        input.onkeyup = function(e) {
            if (e.key == "Escape") {
                fnRemoveOptionsList();
                (e.target as HTMLTextAreaElement).blur();
                (e.target as HTMLTextAreaElement).value = null;
            } else {
                fnCreateOptionsList((e.target as HTMLTextAreaElement).value);
            }
        }

        // Selected items list
        let selected = document.createElement("ul");
        selected.classList.add("selected-list");

        // Append elements to the DOM
        container.appendChild(input);
        container.appendChild(selected);
        this.target.appendChild(container);

        // Apply the previosuly set selections
        fnUpdateSelectedList();
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}

export function logExceptions(): MethodDecorator {
    return function (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> {
        return {
            value: function () {
                try {
                    return descriptor.value.apply(this, arguments);
                } catch (e) {
                    console.error(e);
                    throw e;
                }
            }
        }
    }
}