# Elo Rating Generator Script

## About Elo ratings
Elo is a rating system originally created for chess but now widely used for many sports and competitions. The idea is simple: when a player wins a match, his or her rating will increase, otherwise, it will go down. To calculate the Elo rating value, two main variables are considered:
- The matches that the player has already played
- The opponent's Elo rating. This means that the rating will also depend on the strength of the opponent.

More information can be found in the following links:
- [An introduction to tennis Elo](http://www.tennisabstract.com/blog/2019/12/03/an-introduction-to-tennis-elo/)
- [Tennis Elo modelling](https://www.betfair.com.au/hub/tennis-elo-modelling/)
- [Analysis of Elo ratings to compare historical players](https://fivethirtyeight.com/features/serena-williams-and-the-difference-between-all-time-great-and-greatest-of-all-time/#fn-2)

## About the script
This script was created based on [the hdai implementation](https://github.com/hdai/elo_tennis) and was adapted to use the [ATP Tour Dataset](https://datahub.io/sports-data/atp-world-tour-tennis-data) provided by DataHub.
The script will generate the weekly ELO ranking using matches between 1973 and 2017 for the active players.

## Setup and execution
To run this script follow these steps:
1. If not done already, follow the instructions of the [report documentation](../../report) to download the dataset files and configure the report
2. Download and install [Miniconda](https://docs.conda.io/en/latest/miniconda.html) for Python 3.8
3. Open the [Anaconda Prompt](https://docs.anaconda.com/anaconda/user-guide/getting-started/)
4. Create a Conda environment using the YAML file by running the following command: `conda env create -f environment.yml`
5. Run `conda activate elo-ranking` to enable the environment that was just created
6. Execute the script by running `python ranking.py`

The script will generate a separate file per rating type (one for the overall rating and one for each surface type) with the weekly Elo ratings. The files will be saved in the [dataset](../../report/dataset) folder.

To update the report with the Elo rating data, click the **Refresh** button from Power BI Desktop.


