# Custom table with dynamic header names

## Summary

This sample shows how to implement a custom table that features dynamic header names. The custom visual is developed with [Power BI's custom visual SDK](https://docs.microsoft.com/en-us/power-bi/developer/visuals/environment-setup?tabs=windows) and [Tabulator](http://tabulator.info/), a library used for designing and styling our table. 

## Folder Structure

```
└─── dynamic-headers
     │── assets
     │    │─── sample-dataset.xlsx 
     │    └─── sample-report.pbix 
     │
     │── custom-visual
     │    │── assets
     │    │    └─── icon.png 
     │    │
     │    │── src
     │    │    │─── settings.ts  
     │    │    └─── visual.ts 
     │    │
     │    │── style
     │    │    └─── visual.less 
     │    │
     │    │── capabilities.json 
     │    │── packages.json
     │    │── pbiviz.json
     │    │── tsconfig.json
     │    └── tslint.json
     │
     └─── README.md
```

## How to run this sample

A sample report with our custom visual imported on it can be found on *assets/sample-report.pbix*. If you want to get the custom visual running on *development mode*, follow the instructions below.

### Environment Setup

1. On [Power BI Service](https://app.powerbi.com/), go to **Settings/General/Developer** and click on *Enable custom visual debugging using the developer visual*.
2. Download and install [NodeJS](https://nodejs.org/en/).
3. Open a terminal and run the following command to install the [Pbiviz tool](https://docs.microsoft.com/en-us/power-bi/developer/visuals/environment-setup?tabs=windows#create-and-install-a-certificate):

```ps1
npm i -g powerbi-visuals-tools
```

4. Create and install a certificate to ensure secure interactions between your computer and the Power BI Service:

```ps1
pbiviz --install-cert
```

This command does two things: Returns a numeric *passphrase* and starts the *Certificate Import Wizard*.

5. Once the *Certificate Import Wizard* opens:

- Select *current user* as the store location
- In the *File to import* window select next.
- In the *Private Key Protection* window, in the Password text box, paste the numeric passphrase received when executing the previous step.
- In the *Certificate Store* window, select the *Place all certificates in the following store* option, and select Browse.
- Select *Trusted Root Certification Authorities*

### Running the custom visual on development mode
 
1. Open the command line and move to the ```custom-visual``` folder. Then install the project dependencies using *npm*:

```
npm install
```

2. Start the visual:

```
pbiviz start
```

Edit any report on [Power BI Service](https://app.powerbi.com/) and create a *Developer Visual* from the Visualization pane. Our custom visual will be displayed on thet created item.

### Importing the custom visual into a report

When you are ready to import the custom visual on your report definitely, package it:

```
pbiviz package
```

In the *Visualizations Pane* select *Get More Visuals*. Browse to the */dist* folder and select the *.pbiviz* file generated in the previous step. The default generated file should be named _dynamicHeaders.*.pbiviz_.

## Implementation analysis

### capabilities.ts

#### Data roles
- Static column values: Defines the columns that have a static title, just like a regular table.
- Dynamic column values: Defines the table columns which their header title must be dynamic. Each dynamic column value must have a corresponding dynamic column header.
- Dynamic column headers: Defines fields/measures that work as the title of the dynamic title columns.
 
 ```json
   "dataRoles": [
    {
      "displayName": "Static column values",
      "name": "static_column_values",
      "kind": "GroupingOrMeasure"
    },
    {
      "displayName": "Dynamic column headers",
      "name": "dynamic_column_headers",
      "kind": "Measure"
    },
    {
      "displayName": "Dynamic column values",
      "name": "dynamic_column_values",
      "kind": "GroupingOrMeasure"
    }
  ]
```

#### Data view mapping
The type of data mapping chosen for this visual is _table_:

```json
  "dataViewMappings": [
    {
      "table": {
        "rows": {
          "select": [
            {
              "for": {
                "in": "static_column_values"
              }
            },
            {
              "for": {
                "in": "dynamic_column_headers"
              }
            },
            {
              "for": {
                "in": "dynamic_column_values"
              }
            }
          ]
        }
      }
    }
  ]
```

### visual.ts

Base html elements to display the custom table and validation messages are created on the *constructor()*:

```ts
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
}
```

The *update()* method is where the heart of our logic is written. The first step is to retrieve and format the input data received from the columns. It is important to make a distinction between the static and dynamic column data roles:

```ts
  public update(options: VisualUpdateOptions) {
    var tableColumns = options.dataViews[0].table.columns;        
    var tableRows = options.dataViews[0].table.rows;

    // Rewrite columns index based on their order
    tableColumns.forEach((tableColumn, index) =>  tableColumn.index = index);
    
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
    
    ....
```

In this part of the *update()* method, we check whether the **dynamic column values** and **dynamic column headers** data roles have the same number of fields. If that's not the case, then an error message will be displayed. This is required because a **dynamic column value** must have a related **dynamic column header**, otherwise a column with no header title could be shown, which is wrong:

```ts
    if (dynamicColumnValues.length != dynamicColumnHeaders.length) {
        this.error_message_html.innerHTML = "The number of Dynamic Header fields should be the same to the Dynamic Values fields";
        this.dynamic_table_html.style.display = "none";
        this.error_message_html.style.display = "block";
        return;
    }
    else {
        this.error_message_html.innerHTML = "";
        this.dynamic_table_html.style.display = "block";
        this.error_message_html.style.display = "none"; 
    }
```

This is where the header title of the defined **dynamic column value** is updated. Each of these columns gets its title from the **dynamic column header** field that shares the same role index. The value of the titles is extracted from the input rows. Additionally, columns that contain a blank title are filtered out and, therefore, not displayed:

```ts
    // Change title of dynamic column values
    dynamicColumnValues = dynamicColumnValues
        .map(dynamicColumnValue => {
            let relateddynamicColumnHeader = dynamicColumnHeaders
                .find( dynamicColumnHeader => dynamicColumnValue.roleIndex == dynamicColumnHeader.roleIndex );

            dynamicColumnValue.displayName = tableRows[0]?.[relateddynamicColumnHeader.index] as string;
            return dynamicColumnValue;
        })
        .filter(dynamicColumnValue => dynamicColumnValue.displayName);
```

To make things easier, the table is created through the **Tabulator** library. For this reason, the columns need to be formatted according to the criteria that this third-party library requires:

``` ts
    let mergedColumns = staticColumnValues.concat(dynamicColumnValues);

    let formattedColumns = mergedColumns.map(column => { return { title: column.displayName, field: column.index.toString() } });

    new Tabulator("#dynamic-header-table", {
        data: tableRows,
        height: "100%",
        layout:"fitColumns",  
        columns: formattedColumns
    });
```

## Sources
- [Set up your environment for developing a Power BI custom visual](https://docs.microsoft.com/en-us/power-bi/developer/visuals/environment-setup?tabs=windows)
- [Tabulator](http://tabulator.info/)
