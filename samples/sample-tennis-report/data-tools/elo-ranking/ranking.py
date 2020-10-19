import csv
import os
import pandas
import sys

from pandas import DataFrame, Series
from datetime import datetime, timedelta, date

players_csv = '../../report/dataset/player_overviews_unindexed_csv.csv'
matches_csv = ['../../report/dataset/match_scores_1968-1990_unindexed_csv.csv',
               '../../report/dataset/match_scores_1991-2016_unindexed_csv.csv',
               '../../report/dataset/match_scores_2017_unindexed_csv.csv']
tourneys_csv = '../../report/dataset/tournaments_1877-2017_unindexed_csv.csv'


def k_factor(matches_played):
    # This function returns the calculated k factor based on the matches played and the selected values
    # for the constants k, offset and shape. The parameters values are set based on FiveThirtyEight suggestion:
    # https://fivethirtyeight.com/features/serena-williams-and-the-difference-between-all-time-great-and-greatest-of-all-time
    k = 250
    offset = 5
    shape = 0.4
    return k/(matches_played + offset)**shape


def calc_expected_score(playerA_rating, playerB_rating):
    # This function calculates the probabilties for playerA to win the match against playerB
    # based on the elo modelling from this sample: https://www.betfair.com.au/hub/tennis-elo-modelling
    exp_score = 1/(1+(10**((playerB_rating - playerA_rating)/400)))
    return exp_score


def update_elo(old_elo, k, is_winner, expected_score):
    # This function updates the elo rating based on the previous value and the calculated
    # k factor and expected score.
    new_elo = old_elo + k * ((1 if is_winner else 0) - expected_score)
    return new_elo


def read_players(csv_file):
    with open(csv_file) as csvfile:
        read_csv = csv.reader(csvfile, delimiter=',')
        # player_id, last_name, first_name, flag_code, turned_pro
        cols_index = [0, 2, 3, 5]
        all_players = []
        for row in read_csv:
            player_info = [""]
            for col_index in cols_index:
                player_info.append(row[col_index])
            all_players.append(player_info)
    headers = ['week_title', 'player_id',
               'last_name', 'first_name', 'flag_code']
    players = DataFrame(all_players, columns=headers)
    players['current_elo'] = Series(1500, index=players.index)
    players['last_tourney_date'] = Series('N/A', index=players.index)
    players['matches_played'] = Series(0, index=players.index)
    players['peak_elo'] = Series(1500, index=players.index)
    players['peak_elo_date'] = Series('N/A', index=players.index)
    players['retirement_year'] = Series('N/A', index=players.index)
    players['turned_pro'] = Series('N/A', index=players.index)
    return players


def initialize_elo_ranking_file():
    filename_map = {
        'Grass': '../../report/dataset/WeeklyRatingGrass.csv',
        'Carpet': '../../report/dataset/WeeklyRatingCarpet.csv',
        'Clay': '../../report/dataset/WeeklyRatingClay.csv',
        'Hard': '../../report/dataset/WeeklyRatingHard.csv',
        'General': '../../report/dataset/WeeklyRating.csv'
    }
    for surface, ranking_filename in filename_map.items():
        if os.path.exists(ranking_filename):
            os.remove(ranking_filename)
        headers = ['week_title', 'player_id', 'last_name', 'first_name', 'flag_code', 'current_elo', 'last_tourney_date',
                   'matches_played', 'peak_elo', 'peak_elo_date', 'retirement_year', 'turned_pro']
        with open(ranking_filename, 'w', newline='') as result_file:
            writer = csv.writer(result_file, delimiter=',')
            writer.writerows([headers])
    return filename_map


def build_tourney_map(tourneys_csv):
    tourney_map = {}
    tourney_year_col = 0
    tourney_id_col = 3
    tourney_date_col = 6
    tourney_surface_col = 12
    with open(tourneys_csv) as csvfile:
        read_csv = csv.reader(csvfile, delimiter=',')
        next(read_csv)
        for row in read_csv:
            if row[tourney_id_col] not in (None, ""):
                if row[tourney_year_col] not in tourney_map.keys():
                    tourney_map[row[tourney_year_col]] = {}
                tourney_map[row[tourney_year_col]][row[tourney_id_col]] = [
                    row[tourney_date_col], row[tourney_surface_col]]
    return tourney_map


def read_matches(matches_csv_files, tourneys_csv, players):
    tourney_map = build_tourney_map(tourneys_csv)
    players_map = {}
    all_matches = []
    for csv_file in matches_csv_files:
        print("Processing the %s file" % csv_file)
        with open(csv_file) as csvfile:
            read_csv = csv.reader(csvfile, delimiter=',')
            next(read_csv)
            # winner_player_id, loser_player_id
            cols_index = [8, 11]
            for row in read_csv:
                tourney_year, tourney_id = row[0].split('-')
                tourney_date, tourney_surface = tourney_map[tourney_year][tourney_id]
                if datetime.strptime(tourney_date, "%Y.%m.%d").date() < date(1972, 12, 26):
                    continue
                match_info = [datetime.strptime(
                    tourney_date, "%Y.%m.%d").date(), tourney_surface]
                for col_index in cols_index:
                    match_info.append(row[col_index])
                    if (row[col_index] not in players_map.keys()):
                        players_map[row[col_index]] = [int(tourney_year), None]
                    else:
                        players_map[row[col_index]][1] = int(tourney_year)
                all_matches.append(match_info)
    headers = ['tourney_date', 'tourney_surface',
               'winner_player_id', 'loser_player_id']
    matches = DataFrame(all_matches, columns=headers)
    matches = matches.sort_values(by='tourney_date').reset_index()
    last_match_year = matches.tail(
        1).loc[matches.index.stop - matches.index.step, 'tourney_date'].year

    # Process the players dataframe to add the year of the first and last played match
    for player_id, dates_list in players_map.items():
        try:
            player_index = players[players['player_id'] == player_id].index.tolist()[
                0]
            # Update turned_pro and retirement_year from data in matches dataset
            players.loc[player_index, 'turned_pro'] = dates_list[0]
            # If retirement_year on dates_list is None, it's because the player only played one match.
            # Set turned pro year as retirement year too. If retirement year is the current last match year
            # set retirement year to blank.
            retirement_year = dates_list[1] if dates_list[1] != None else dates_list[0]
            players.loc[player_index, 'retirement_year'] = retirement_year
        except IndexError:
            print("Player not found on dataset: %s" % player_id)
            continue
    return matches


def save_week(current_date, players, filename):
    players['week_title'] = current_date.strftime('%Y.%m.%d')
    condition = 'turned_pro <= %d & retirement_year >= %d' % (
        current_date.year, current_date.year)
    players.query(condition, inplace=True)
    with open(filename, 'a', newline='') as weekly_file:
        players.loc[players.retirement_year ==
                    2017, 'retirement_year'] = ''
        players.to_csv(weekly_file, index=False, header=False)


def get_row_index_by_player_id(players, player_id):
    try:
        return players[players['player_id'] == player_id].index.tolist()[0]
    except:
        print("Player not found on dataset: %s" % player_id)
        return None


def get_mondays(matches):
    first_day = matches.head(1).loc[0, 'tourney_date']
    last_day = matches.tail(
        1).loc[matches.index.stop - matches.index.step, 'tourney_date']
    if first_day.weekday() != 0:
        first_day = first_day + timedelta(days=(7 - first_day.weekday()))
    if last_day.weekday() != 0:
        last_day = last_day + timedelta(days=(7 - last_day.weekday()))
    current_monday = first_day
    mondays = []
    while current_monday <= last_day:
        mondays.append(current_monday)
        current_monday = current_monday + timedelta(days=7)
    return mondays


def update_players_data(players, tourney_date, winner_index, loser_index):
    current_elo_winner = players.loc[winner_index, 'current_elo']
    current_elo_loser = players.loc[loser_index, 'current_elo']
    expected_score_winner = calc_expected_score(
        current_elo_winner, current_elo_loser)
    expected_score_loser = 1 - expected_score_winner
    matches_played_winner = players.loc[winner_index, 'matches_played']
    matches_played_loser = players.loc[loser_index, 'matches_played']
    new_elo_winner = update_elo(old_elo=current_elo_winner, k=k_factor(
        matches_played_winner), is_winner=True, expected_score=expected_score_winner)
    new_elo_loser = update_elo(old_elo=current_elo_loser, k=k_factor(
        matches_played_loser), is_winner=False, expected_score=expected_score_loser)

    # Update players DataFrame
    players.loc[winner_index, 'current_elo'] = new_elo_winner
    players.loc[winner_index, 'last_tourney_date'] = tourney_date
    players.loc[winner_index,
                'matches_played'] = matches_played_winner + 1
    players.loc[loser_index, 'current_elo'] = new_elo_loser
    players.loc[loser_index, 'last_tourney_date'] = tourney_date
    players.loc[loser_index,
                'matches_played'] = matches_played_loser + 1
    if new_elo_winner > players.loc[winner_index, 'peak_elo']:
        players.loc[winner_index, 'peak_elo'] = new_elo_winner
        players.loc[winner_index,
                    'peak_elo_date'] = tourney_date


def build_players_map(players, rating_types):
    players_map = {}
    for rating_type in rating_types:
        players_map[rating_type] = players.copy()
    return players_map


def main():
    rating_types = ['General', 'Carpet', 'Grass', 'Clay', 'Hard']
    filename_map = initialize_elo_ranking_file()
    players = read_players(players_csv)
    matches = read_matches(matches_csv, tourneys_csv, players)
    players = players[players['turned_pro'] != 'N/A']
    players_map = build_players_map(players, rating_types)
    # Build saving dates
    mondays = get_mondays(matches)
    previous_monday = mondays[0] - timedelta(days=7)
    for monday in mondays:
        week_matches = matches[(matches['tourney_date'] > previous_monday) & (
            matches['tourney_date'] <= monday)]
        for index, row in week_matches.iterrows():
            # Get match and players data
            tourney_date = row['tourney_date'].strftime("%Y.%m.%d")
            winner_id = row['winner_player_id']
            loser_id = row['loser_player_id']
            match_surface = row['tourney_surface']
            row_index_winner = get_row_index_by_player_id(
                players_map['General'], winner_id)
            row_index_loser = get_row_index_by_player_id(
                players_map['General'], loser_id)

            # Verify if either players are not in the dataset.
            if None in [row_index_loser, row_index_winner]:
                continue
            if match_surface != '':
                update_players_data(players_map[match_surface], tourney_date,
                                    row_index_winner, row_index_loser)
            update_players_data(players_map['General'], tourney_date,
                                row_index_winner, row_index_loser)
        previous_monday = monday
        for rating_type in rating_types:
            save_week(monday, players_map[rating_type].copy(),
                      filename_map[rating_type])
        weeks_remaining = len(mondays) - mondays.index(monday) - 1
        print("Weeks remaining: %d" % weeks_remaining)


if __name__ == '__main__':
    main()
