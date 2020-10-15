# Power BI Report

## Configuration
Follow these steps to configure and visualize the report using Power BI Desktop:

1. If not already installed, download and install Power BI Desktop either from the [Microsoft Website](https://powerbi.microsoft.com/en-us/downloads/ "Microsoft Website") or the [Windows Store](https://www.microsoft.com/en-us/p/power-bi-desktop/9ntxr16hnw1t?activetab=pivot:overviewtab "Windows Store").
2. Create a folder to store the the CSV files that will be loaded by the report upon starting.
3. The report uses the [ATP World Tour Tennis dataset](https://datahub.io/sports-data/atp-world-tour-tennis-data "ATP World Tour Tennis dataset") provided by [Datahub](https://datahub.io/). Download the CSV dataset files and extract them in the folder created in the previous step.
4. This repository contais extra dataset files used by the report. Copy the content of the [report/dataset/](dataset/) folder to the folder created in the Step 2 and extract the tarball (`.tar.gz`) files.
5. Run Power BI Desktop and open the `sample-tennis-report.pbit` file located in this folder. You will be prompted to enter the absolute path to the folder created in the Step 2, and then, the dataset CSV files at startup. This can take a few minutes to complete.


![Dataset Path Prompt](../assets/prompt-dataset-path.jpg)