# Custom Visuals
This directory contains all the files needed to run all the custom visuals included in it.
At the moment, these are the available custom visuals:
- Multiple Select Slicer
- Comparison Chart

## Folder structure
```bash
└─── {custom visual}
│    │── README.md
│    │
│    │── assets
│    │    └─── icon.png (icon that will be shown in the visuals list)
│    │
│    │── dist
│    │    └─── *.pbiviz (custom visual package file)
│    │
│    │── src
│    │    │─── settings.ts (custom visual settings classes)
│    │    └─── visual.ts (custom visual source code)
│    │
│    │── capabilities.json (defines the settings and capabilities of the custom visual)
│    │── packages.json
│    └── pbiviz.json (defines the metadata of the custom visual)
└─── README.md
```

## Development stack
- [Typescript](https://www.typescriptlang.org/)
- [LESS](http://lesscss.org/)
- HTML5

## Environment setup
1. Download and install [NodeJS](https://nodejs.org/es/download/) and add the assembly to the system PATH
2. Open a command line and run `npm i -g powerbi-visuals-tools` to install the Power BI Visual Tools SDK
3. Move to the custom visual folder and run `npm install` to restore the packages defined in the `packages.json` file
3. Run `pbiviz --install-cert` to generate the signing certificate. Once the *Certificate Import Wizard* is open use the generated Passphrase to import the certificate in the *Trusted Root Certification Authorities* store
4. Log in in http://app.powerbi.com with your credentials, go to the account settings and enable the *Developer* switch
5. Run `pbiviz start` to start the debug session.
6. Upload a Power BI report to your cloud account.
7. Use the `Debug Visual` to debug your custom visual
6. Once you are done, run `pbiviz package` to generate the custom visual package and import it in Power BI Desktop

## Debugging
Custom visuals are embedded in the report inside an iFrame. Therefore, when running in http://app.powerbi.com you can use the same debugging and troubleshooting tools that you may use in a normal web application.
For example:
- Programmatic breakpoints with the `debugger` keyword
- Conditional breakpoints using the Developer Tools
- `console.log` statements
- Configure the Developer Tools to break on exception and inspect variables

## Useful links
 - [Environment Configuration](https://docs.microsoft.com/en-us/power-bi/developer/visuals/custom-visual-develop-tutorial)
 - [Add formatting options to the custom visual](https://docs.microsoft.com/en-us/power-bi/developer/visuals/custom-visual-develop-tutorial-format-options)
 - [Custom Visuals Filter API Reference](https://docs.microsoft.com/en-us/power-bi/developer/visuals/filter-api)
 - [Troubleshooting best practices](https://docs.microsoft.com/en-us/power-bi/developer/visuals/power-bi-custom-visuals-troubleshoot)