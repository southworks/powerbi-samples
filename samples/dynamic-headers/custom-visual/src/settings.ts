'use strict';

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
  public dataTable: tableSettings = new tableSettings();
}

export class tableSettings {
  // Row Background color
  public rowBackgroundColor: string = '';

  // Header Background Color
  public headerBackgroundColor: string = '';

  // Text Size
  public fontSize: number = 12;

  // Hide columns with no row values
  public hideEmptyColumns: boolean = false;
}