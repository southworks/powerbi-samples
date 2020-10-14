# Multi-Selection Slicer
This custom visual was created to enhance the user experience when selecting players in the _Head to Head Comparison_ section of the sample report. While the built-in Power BI slicer can only be configured for single or multiple selection, this custom slicer allows specifying the minimum number of selected elements for the filter to be applied.

## Considerations
 - The filter will only be applied when the number of elements selected is greater or equal than the minimum defined (default: 1)
 - The user won't be able to select more elements than the maximum defined (default: 2)

## Development setup
To update or debug the custom visual, refer to the [custom visuals documentation](../README.md) and follow instructions to set up the development environment.