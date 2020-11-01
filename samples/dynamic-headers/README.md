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
- Static title columns: Defines the columns that have a static title, just like a regular table.
- Dynamic title columns: Defines the table columns which their header title must be dynamic. Each dynamic title column must have a corresponding dynamic header title.
- Dynamic header titles: Defines measures that work as the title of the dynamic title columns.
 
 ```json
   "dataRoles": [
    {
      "displayName": "Static title columns",
      "name": "static_title_columns",
      "kind": "GroupingOrMeasure"
    },
    {
      "displayName": "Dynamic header titles",
      "name": "dynamic_header_titles",
      "kind": "Measure"
    },
    {
      "displayName": "Dynamic title columns",
      "name": "dynamic_title_columns",
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
                "in": "static_title_columns"
              }
            },
            {
              "for": {
                "in": "dynamic_header_titles"
              }
            },
            {
              "for": {
                "in": "dynamic_title_columns"
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

The *update()* method is where the heart of our logic is written. The first step is to retrieve and format the input data received from the columns. It is important to make a distinction between the static and dynamic title columns data roles:

```ts
  public update(options: VisualUpdateOptions) {
    var tableColumns = options.dataViews[0].table.columns;
    var tableRows = options.dataViews[0].table.rows;

    // Rewrite columns index based on their order
    tableColumns.forEach((tableColumn, index) => (tableColumn.index = index));

    // Get all different data roles
    var staticTitleColumns = tableColumns
      .filter(
        (staticTitleColumn) =>
          staticTitleColumn.roles.static_title_columns == true
      )
      .map((staticTitleColumn) => {
        return {
          index: staticTitleColumn.index,
          roleIndex: staticTitleColumn["rolesIndex"].static_title_columns[0],
          displayName: staticTitleColumn.displayName,
        };
      })
      .sort((a, b) => a.roleIndex - b.roleIndex);

    var dynamicTitleColumns = tableColumns
      .filter(
        (dynamicTitleColumn) =>
          dynamicTitleColumn.roles.dynamic_title_columns == true
      )
      .map((dynamicTitleColumn) => {
        return {
          index: dynamicTitleColumn.index,
          roleIndex: dynamicTitleColumn["rolesIndex"].dynamic_title_columns[0],
          displayName: dynamicTitleColumn.displayName,
        };
      })
      .sort((a, b) => a.roleIndex - b.roleIndex);
    
    ....
```

In this part of the *update()* method, we check whether the **dynamic title columns** and **dynamic header titles** data roles have the same number of fields. If that's not the case, then an error message will be displayed. This is required because a **dynamic title column** must have a related **dynamic header title**, otherwise a column with no header title could be shown, which is wrong:

```ts
    if (dynamicTitleColumns.length != dynamicHeaderTitles.length) {
      this.error_message_html.innerHTML =
        "The number of Dynamic Header fields should be the same to the Dynamic Values fields";
      this.dynamic_table_html.style.display = "none";
      this.error_message_html.style.display = "block";
      return;
    } else {
      this.error_message_html.innerHTML = "";
      this.dynamic_table_html.style.display = "block";
      this.error_message_html.style.display = "none";
    }
```

This is where the header title of the defined **dynamic title columns** is updated. Each of these columns get its title from the **dynamic header title** field that shares the same role index. The value of the titles is extracted from the input rows. Additionally, columns that contain a blank title are filtered out and, therefore, not displayed:

```ts
    // Change title to dynamic title columns
    dynamicTitleColumns = dynamicTitleColumns
      .map((dynamicTitleColumn) => {
        let relatedDynamicHeaderTitle = dynamicHeaderTitles.find(
          (dynamicHeaderTitle) =>
            dynamicTitleColumn.roleIndex == dynamicHeaderTitle.roleIndex
        );

        dynamicTitleColumn.displayName = tableRows[0]?.[relatedDynamicHeaderTitle.index] as string;
        return dynamicTitleColumn;
      })
      .filter((dynamicTitleColumn) => dynamicTitleColumn.displayName);
```

To make things easier, the table is created through the **Tabulator** library. For this reason, the columns need to be formatted according to the criteria that this third-party library requires:

``` ts
    let mergedColumns = staticTitleColumns.concat(dynamicTitleColumns);

    let formattedColumns = mergedColumns.map((column) => {
      return { title: column.displayName, field: column.index.toString() };
    });

    // Create tabulator table
    new Tabulator("#dynamic-header-table", {
      data: tableRows,
      height: "100%",
      layout: "fitColumns",
      columns: formattedColumns,
    });
```

## Sources
- [Set up your environment for developing a Power BI custom visual](https://docs.microsoft.com/en-us/power-bi/developer/visuals/environment-setup?tabs=windows)
- [Tabulator](http://tabulator.info/)
