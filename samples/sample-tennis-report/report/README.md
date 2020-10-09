# Power BI Report

## Configuration
Follow these steps to configure and visualize the report using Power BI Desktop:

1. If not already installed, download and install Power BI Desktop either from the [Microsoft Website](https://powerbi.microsoft.com/en-us/downloads/ "Microsoft Website") or the [Windows Store](https://www.microsoft.com/en-us/p/power-bi-desktop/9ntxr16hnw1t?activetab=pivot:overviewtab "Windows Store").
2. Create a folder named `dataset` in your `C` drive. This folder will store the CSV dataset files that will be used by the report upon starting.
3. The report uses the [ATP World Tour Tennis dataset](https://datahub.io/sports-data/atp-world-tour-tennis-data "ATP World Tour Tennis dataset") provided by [Datahub](https://datahub.io/). Download the CSV dataset files and extract them in the [dataset](c:\dataset\) folder created in the previous steps.
4. This repository contais extra dataset files used by the report. Copy the content of the [dataset/](../dataset/) folder to the folder created in the Step 2 and extract the tarball (`.tar.gz`) files.
5. Run Power BI Desktop and open the `atp-tour.pbit` file located in this folder. The report will load the dataset CSV files at startup, this can take a few minutes to complete.
