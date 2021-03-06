# Sample Power BI Report for Tennis Datasets

This sample consists of a Power BI report that consumes a tennis dataset (e.g. players, tournaments and matches data) and provides visualizations to analyze players performance, rankings/ratings and to predict hypothetical matches.

## Folder structure
The repository contains the assets and tools used to create the Power BI report.

```bash
└─── sample-tennis-report
   │── README.md
   │   
   │─── custom-visuals
   |         │─── comparison-chart
   |         └─── multiple-selection-slicer
   |
   │─── report
   |         │─── dataset (CSV files)
   |         └─── atp-tour.pbix
   |
   │─── themes
   |         │─── logo.png
   |         └─── theme.json
   |
   └─── data-tools
              └─── elo-ranking
```

Each subfolder (custom-visuals, tools, report, etc.) contains its own README file with additional details including setup instructions and considerations.

## Power BI report
To get started, follow the instructions in the [report documentation](report) to configure and visualize the report.

## Custom visuals
A set of custom visuals were created to extend the out-of-the-box visualization features provided by Power BI:

[Multi-Selection Slicer](custom-visuals/multiple-selection-slicer "Multiple Selection Slicer:"). A custom slicer whose selection is only applied when the amount of selected options meets certain range criteria. This visual is used across the report for players selection.

[Comparison Chart](custom-visuals/comparison-chart "Comparison chart:"). A "tornado" like chart visual to compare side-by-side measures (or calculated columns) for two different values of a given field. This visual is used to compare the performance indicators between two players.

For more details refer to the [custom visuals documentation](custom-visuals).

## Report themes
Styling assets supported by Power BI used across the report to provide a consistent look & feel. For more details, visit the [themes documentation](themes).

## Data tools
The following Python scripts can be used to generate extra data to enrich the tennis dataset of the Power BI report:

[Elo Ratings Calculator](data-tools/elo-ranking "Elo Ratings Calculator"). Calculates the overall and by-surface weekly Elo ratings.
