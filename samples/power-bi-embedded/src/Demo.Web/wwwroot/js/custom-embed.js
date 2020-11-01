var report = null;
var filterOptions = {
    preserveFilters: false,
    mappedFilters: {}
};
var isFirstRender = true;
const PRESERVE_FILTERS_TAG = "preserve_filters";

// Initializes the filter options
$(document).ready(function () {
    var preserve_filters = localStorage.getItem(PRESERVE_FILTERS_TAG);
    filterOptions.preserveFilters = preserve_filters == "true";
    $(`#preserve-filters-${filterOptions.preserveFilters}`).prop("checked", true);
});

/**
 * Loads a report using its ID within a specific container.
 * @param {string}  containerId Identifier of the HTML element where the report will be embedded.
 * @param {string}  reportId    Report ID to be embedded.
 * @param {string}  pageId      [optional] Page section with which the report starts.
 * @param {any[]}   filters     [optional] [{ table: <tableName>, column: <columnName>, values: <values> }, ...]
 */
function loadReport(containerId, reportId, pageId = null, filters = []) {
    // Change page on the same report
    if (report != null && report.config.id == reportId && pageId) {
        report.setPage(pageId)
            .catch(function (error) {
                log.error(error.detailedMessage);
            });

        return;
    }

    // Before loading the new report the mappedFilters object must be updated
    if (report) {
        if (filterOptions.preserveFilters) {
            for (var key of Object.keys(filterOptions.mappedFilters)) {
                let item = filterOptions.mappedFilters[key];
                if (item && item.report_id != report.config.id) {
                    delete filterOptions.mappedFilters[key];
                }
            }
        } else {
            filterOptions.mappedFilters = {};
        }
    }

    // Clean the report container
    $(`#${containerId}`).empty();

    var reportContainer = $(`#${containerId}`).get(0);

    // Reset powerbi when a new report needs to be embedded
    if ((report != null && report.config.id != reportId) || powerbi.embeds.length) {
        report.off("loaded");
        report.off("rendered");
        report.off("error");
        report.off("dataSelected");
        report.off("dataHyperlinkClicked");
        powerbi.reset(reportContainer);
        report = null;
    }

    // Initialize iframe for embedding report
    powerbi.bootstrap(reportContainer, { type: "report" });

    _generateEmbedToken(reportId,
        function (embedData) {
            _embedReport(embedData, reportContainer, pageId, filters);
        },
        function (errorData) {
            log.error(errorData.message);
        }
    );
}

/**
 * Makes a request to the server to get the parameters to embed a report.
 * @param {string}   reportId           Report ID.
 * @param {Function} successCallback    Callback function.
 * @param {Function} errorCallback      Callback function.
 */
function _generateEmbedToken(reportId, successCallback, errorCallback) {
    $.ajax({
        type: "GET",
        url: "/report/getembedparams?reportId=" + reportId,
        success: function (data) {
            successCallback(data);
        },
        error: function (error) {
            errorCallback(error.responseJSON);
        }
    });
}

/**
 * Embeds a report using the parameters obtained from the server.
 * @param {any}         embedData   Object that contains the information to embed a report.
 * @param {HTMLElement} container   Element to embed the report.
 * @param {string}      pageId      [optional] Page section with which the report starts.
 * @param {any[]}       filters     [optional] [{ table: <tableName>, column: <columnName>, values: <values> }, ...]
 */
function _embedReport(embedData, container, pageId = null, filters = []) {
    var models = window["powerbi-client"].models;

    var config = {
        type: "report",
        tokenType: models.TokenType.Embed,
        accessToken: embedData.embedToken,
        embedUrl: embedData.embedUrl,
        settings: {
            background: models.BackgroundType.Transparent,
            hyperlinkClickBehavior: models.HyperlinkClickBehavior.RaiseEvent,
            filterPaneEnabled: false,
            navContentPaneEnabled: false
        }
    };

    if (pageId) {
        config["pageName"] = pageId;
    }

    // Embed Power BI report when Access token and Embed URL are available
    report = powerbi.embed(container, config);

    report.off("loaded");
    report.on("loaded", function () {
        log.debug("Report load successful");
        container.style.backgroundColor = '#dddddd80';
        var iframe = container.childNodes[0];
        iframe.style.visibility = 'hidden';

        var filterObjects = filters.map(filter => _generateFilterObject(filter.table, filter.column, filter.values));

        _initializeSlicers(filterObjects);

        _setTokenExpirationListener(embedData.expiresOn, embedData.safetyIntervalInMinutes, embedData.reportId, container);
    });

    report.off("dataSelected");
    report.on("dataSelected", function (event) {
        if (event.detail.visual.type == "slicer") {
            _handleSlicerEvent(event.detail);
        }
    });

    report.off("dataHyperlinkClicked");
    report.on("dataHyperlinkClicked", function (event) {
        _handleHyperlinkEvent(event, container);
    });

    report.off("rendered");
    report.on("rendered", function () {
        if (isFirstRender) {
            container.style.backgroundColor = '';
            var iframe = container.childNodes[0];
            iframe.style.visibility = 'visible';
            isFirstRender = false;
        }
    });

    report.off("error");
    report.on("error", function (event) {
        log.error(event.detail.message);
    });
}

/**
 * Checks if token is about to expire.
 * @param {string}      tokenExpiration     Token expiration (ISO 8601).
 * @param {number}      minutesToRefresh    Minutes before token expires, request a new embed token.
 * @param {string}      reportId            Report ID.
 * @param {HTMLElement} container           Element that contains the report embedded.
 */
function _setTokenExpirationListener(tokenExpiration, minutesToRefresh, reportId, container) {
    var currentTime = Date.now();
    var expirationTime = Date.parse(tokenExpiration);
    // update the embed token milliseconds before it expires
    var safetyInterval = minutesToRefresh * 60 * 1000;

    // time until token refresh in milliseconds
    var timeout = expirationTime - currentTime - safetyInterval;

    // if token already expired, generate new token and set the access token
    if (timeout <= 0) {
        log.debug("Updating Report Embed Token");
        _updateEmbedToken(reportId, container);
    } else {
        log.debug(`Report Embed Token will be updated in ${(timeout / (1000 * 60)).toFixed(2)} minutes.`);
        setTimeout(function () {
            _updateEmbedToken(reportId, container);
        }, timeout);
    }
}

/**
 * Generates a new embed token for the report.
 * @param {string}      reportId    Report ID.
 * @param {HTMLElement} container   Element that contains the report embedded.
 */
function _updateEmbedToken(reportId, container) {
    _generateEmbedToken(reportId,
        function (embedData) {
            // Get a reference to the embedded report.
            var report = powerbi.get(container);

            report.setAccessToken(embedData.embedToken)
                .then(function () {
                    _setTokenExpirationListener(embedData.expiresOn, embedData.safetyIntervalInMinutes, reportId, container);
                });
        },
        function (errorData) {
            log.error(errorData.message);
        }
    );
}

/**
 * Loads slicer filters (current page) and updates their values from mappedFilters if any.
 * @param {IFilter[]} filterObjects [optional] Array of filter objects.
 * */
function _initializeSlicers(filterObjects = []) {
    var filterObjectMap = {};
    for (let i = 0; i < filterObjects.length; i++) {
        let filterObject = filterObjects[i];
        let key = filterObject.target.table + "@" + filterObject.target.column;
        filterObjectMap[key] = filterObject;
    }

    let setSlicerPromises = [];

    _getSlicersAsync()
        .then(_getStatesForAllSlicersAsync)
        .then(items => {
            for (let i = 0; i < items.length; i++) {
                let slicer = items[i].slicer;
                let state = items[i].state;

                let filter = state.filters[0];
                let target = state.targets[0];
                let key = target.table + "@" + target.column;

                let item = filterOptions.mappedFilters[key];

                filter = filter ? filter : _generateFilterObject(target.table, target.column, []);

                if (item) {
                    let savedFilter = item.filter;
                    let diff = savedFilter.values.length != filter.values.length;
                    let str_saved = savedFilter.values.sort().join("");
                    let str_curr = filter.values.sort().join("");

                    diff = diff || str_saved != str_curr;

                    if (diff) {
                        let newState = { filters: [savedFilter] };
                        setSlicerPromises.push(slicer.setSlicerState(newState));
                        filter.values = savedFilter.values;
                    }
                } else {
                    let desiredFilter = filterObjectMap[key];
                    if (desiredFilter) {
                        let newState = { filters: [desiredFilter] };
                        setSlicerPromises.push(slicer.setSlicerState(newState));
                        filter.values = desiredFilter.values;
                    }
                }

                filterOptions.mappedFilters[key] = { report_id: report.config.id, filter: filter };
            }
        });

    Promise.all(setSlicerPromises)
        .then(result => {
            isFirstRender = true;
        })
        .catch(error => {
            isFirstRender = true;
            log.error(error);
        });
}

/**
 * Retrieves the filters in a slicer and keeps them in mappedFilters.
 * @param {any} data It contains information about the filters applied in a slicer.
 */
function _handleSlicerEvent(data) {
    for (var i = 0; i < data.dataPoints.length; i++) {
        var identity = data.dataPoints[i].identity;
        for (var j = 0; j < identity.length; j++) {
            var item = identity[j];
            let key = item.target.table + "@" + item.target.column;
            let filterElement = filterOptions.mappedFilters[key];
            if (filterElement) {
                let values = Array.isArray(item.equals) ? item.equals : [item.equals];
                filterElement.filter.values = values;
            }
        }
    }
}

/**
 * Retrieves the active page of the report pages.
 * @param   {any[]} pagesArray Pages of a report.
 * @returns {Promise<any>} Promise with the active page.
 */
function _getActivePageAsync(pagesArray) {
    return pagesArray.find(page => page.isActive);
}

/**
 * Retrieves all visuals that belongs to a report page.
 * @param   {any} page Page of a report.
 * @returns {Promise<any[]>} Array of visuals.
 */
function _getVisualsForPageAsync(page) {
    return page.getVisuals();
}

/**
 * Filters the visuals of type 'slicer'.
 * @param   {any[]} visualsArray Array of visuals.
 * @returns {any[]} Array of visuals.
 */
function _filterSlicerVisualsAsync(visualsArray) {
    return visualsArray.filter(visual => visual.type === 'slicer');
}

/**
 * Obtains all the states of the slicers and return each slicer with its state.
 * @param {any} slicersArray Array of slicers.
 * @returns {Promise<any[]>} [ { slicer: <slicer>, state: <state> }, ... ]
 */
function _getStatesForAllSlicersAsync(slicersArray) {
    if (slicersArray.length > 0) {
        let promisesArray = [];
        for (var i = 0; i < slicersArray.length; i++) {
            let slicer = slicersArray[i];
            let statePromise = new Promise((resolve, reject) => {
                slicer.getSlicerState()
                    .then(state => {
                        resolve({ slicer: slicer, state: state });
                    });
            });
            promisesArray.push(statePromise);
        }

        return Promise.all(promisesArray);
    } else {
        return Promise.resolve([]);
    }
}

/**
 * Retrieves the slicers from the current page of the report.
 * @returns {Promise<any[]>} Promise with array of slicers.
 * */
function _getSlicersAsync() {
    if (report !== null) {
        return report.getPages()
            .then(_getActivePageAsync)
            .then(_getVisualsForPageAsync)
            .then(_filterSlicerVisualsAsync);
    } else {
        return Promise.resolve([]);
    }
}

/**
 * Creates a filter object that may be for the reports, pages, and visuals.
 * Refer to https://github.com/Microsoft/PowerBI-JavaScript/wiki/Filters#constructing-filters
 * @param {string}  table   Table name.
 * @param {string}  column  Column name.
 * @param {any[]}   values  Values (string[], number[], etc.).
 * @param {string}  displayName [optional] Display name. 
 * @returns {IFilter} Filter object.
 */
function _generateFilterObject(table, column, values, displayName = null) {
    const basicFilter = {
        $schema: "http://powerbi.com/product/schema#basic",
        target: {
            table: table,
            column: column
        },
        operator: "In",
        values: values,
        filterType: 1, // FilterType.BasicFilter
        displaySettings: {
            displayName: displayName ? displayName : column
        }
    };

    return basicFilter;
}

/**
 * Parses the URL and loads a new report.
 * @param {any}         event     It contains information about the URL, report, page, and visual.
 * @param {HTMLElement} container Element where the report is embedded.
 */
function _handleHyperlinkEvent(event, container) {
    if (!event || !event.detail || !event.detail.url)
        return;

    // example https://app.powerbi.com/groups/<groudId>/reports/<reportId>/<pageId>?filter=Employee/City eq 'Snohomish'
    var regex = /https\:\/\/app\.powerbi\.com\/groups\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/reports\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/([A-za-z0-9]*)?(\?filter=.*)?/;
    var url = event.detail.url;
    var match = url.match(regex);
    // match = [ <url>, <groudId>, <reportId>, <pageId | optional>, <filters | optional> ]
    if (match.length > 1 && match[1] && match[2]) {
        var reportId = match[2];
        var pageId = match[3] ? match[3] : null;
        var queryString = match[4] ? match[4] : null;

        var filters = _parseFiltersFromQueryString(queryString);

        loadReport(container.id, reportId, pageId, filters);
    }
}

/**
 * Parses the query string and returns an array of objects.
 * @param   {string} queryString Query that contains information about: tables, columns, values, and operators.
 * @returns {any[]}  [ { table: <tableName>, column: <columnName>, values: <valueArray> }, ... ]
 */
function _parseFiltersFromQueryString(queryString) {
    var filters = [];

    if (queryString) {
        queryString = queryString.replace("?filter=", "");
        var conditions = queryString.split(" and ");
        for (var i = 0; i < conditions.length; i++) {
            var cond = conditions[i];
            if (cond.indexOf(" eq ") !== -1) {
                var params = cond.split(" eq ");
                if (params.length === 2) {
                    var splitted = params[0].split("/");
                    var table = _unescapeName(splitted[0]);
                    var column = _unescapeName(splitted[1]);
                    var values;
                    var value = params[1];

                    if (!isNaN(value)) {
                        value = parseInt(value);
                        values = [value];
                    } else {
                        if (value.startsWith("'") && value.endsWith("'")) {
                            value = value.slice(1, -1);
                        }

                        if (value.startsWith("&#39;") && value.endsWith("&#39;")) {
                            value = value.replace(/&#39;/g, "");
                        }

                        values = [value]
                    }

                    if (table && column) {
                        filters.push({ table: table, column: column, values: values });
                    }
                }
            }
        }
    }

    return filters;
}

/**
 * 
 * @param {string} stringValue
 */
function _unescapeName(stringValue) {
    let unescaped = null;
    let replacerFunction = function (match, offset, string) {
        let hexValue = match.substr(2, 6);
        return String.fromCharCode(parseInt(hexValue, 16));
    };

    if (stringValue) {
        let regex = /_x[0-9A-F]{4}_/gi; // _xHHHH_
        unescaped = stringValue.replace(regex, replacerFunction);
        log.debug("Unescaping: '" + stringValue + "' ==> '" + unescaped + "'");
    }
    return unescaped;
}

/**
 * Updates the report container height depending on screen height.
 * */
function updateReportContainerHeight() {
    let windowH = $(window).height();
    let topBarH = $('#topBar').outerHeight();
    $('#report-container').height(windowH - topBarH);
}

/**
 * Updates the way to maintain the filters between different reports.
 * @param {boolean}  preserve    Flag to indicate if filters should be kept between different reports.
 */
function preserveFilters(preserve) {
    filterOptions.preserveFilters = preserve;

    localStorage.setItem(PRESERVE_FILTERS_TAG, preserve);
}