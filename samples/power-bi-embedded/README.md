Power BI Embedded Sample
====================
This sample project demonstrates how to share Power BI content in an ASP.NET Core MVC application with authenticated users that don't have Power BI accounts. To accomplish this, we will use [Power BI Embedded](https://docs.microsoft.com/en-us/power-bi/developer/embedded/embedding#:~:text=Power%20BI%20Embedded%20is%20a,%2Dbased%2C%20hourly%20metered%20model.), along with [Power BI .NET SDK](https://github.com/microsoft/PowerBI-CSharp), [Power BI JavaScript API](https://github.com/microsoft/PowerBI-JavaScript) and [Azure AD Sign In](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-v2-aspnet-core-webapp).

It's assumed that you are already familiar with Power BI (you know how to create reports, publish them to the Power BI service, etc.) and you already have a workspace hosting reports. If that's not the case, you can refer to:
> - [Get started with Power BI Desktop](https://docs.microsoft.com/en-us/power-bi/fundamentals/desktop-getting-started)
> - [Tutorial: Get started creating in the Power BI service](https://docs.microsoft.com/en-us/power-bi/fundamentals/service-get-started)

## Folder Structure

```
└─── power-bi-embedded
     │── assets
     │    │─── Cities.pbix 
     │    │─── States.pbix 
     │    └─── sample-dataset-cross-report-drill-through.xlsx
     │
     │── src
     │    └── Demo.Web
     │
     └─── README.md
```

# What's Power BI Embedded?
[Power BI Embedded](https://docs.microsoft.com/en-us/power-bi/developer/embedded/azure-pbie-what-is-power-bi-embedded) is a Microsoft Azure service that lets developers quickly embed visuals, reports and dashboards into an application. This embedding is done through a capacity-based, hourly metered model.

Besides adding analytics and interactive reporting to our applications, we can use and brand Power BI as our own, **users don't need to know anything about Power BI**. Moreover, with Power BI Embedded we can take adventage of the [Power BI REST API](https://docs.microsoft.com/en-us/rest/api/power-bi/), which gives us tons of flexibility to work with our content through different service endpoints for embedding, administration and user resources.

In order to embed Power BI content into our app, we need to generate embed tokens that provide access to our Power BI dashboards and reports. There are two ways of doing this, using a:

- **Power BI Pro account (username and password)**. The Power BI Pro account acts as our application's master account (think of it as a proxy account). This user represents our  application and serves as the admin of all the content.
- **Service principal (token-based)**. The [Service principal](https://docs.microsoft.com/en-us/power-bi/developer/embedded/embed-service-principal) embeds Power BI content using an app-only token without the need of a user signing in or having a Power BI Pro license. In this sample we'll be using this method.

Both methods require to [create/register an Azure AD application](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app) and obtain an application ID.

Once we finish completing our development and feel ready to move to production, we will need to [assign a capacitiy](https://docs.microsoft.com/en-us/power-bi/developer/embedded/azure-pbie-create-capacity?tabs=portal) to our workspace. 
>For development testing this is not needed, as we can work with the [available free embed tokens](https://docs.microsoft.com/en-us/rest/api/power-bi/availablefeatures/getavailablefeatures).

# How to run this application
1. Have a Power BI workspace with reports in it. If you don't have any pbix file, you can try out [one of the samples Microsoft provides](https://docs.microsoft.com/en-us/power-bi/create-reports/sample-datasets#sales--returns-sample-pbix-file).

2. Register an Azure AD application:

   - Sign in to the [Azure portal](https://portal.azure.com/).
   - If you have access to multiple tenants, use the *Directory + subscription filter*  in the top menu to select the tenant in which you want to register an application.
   - Search for and select **Azure Active Directory**.
   - Under Manage, select **App registrations**, then **New registration**.
   - Enter a Name for your application.
   - Select **Register**.
   
   Once you register the Azure AD application, **a service principal is created** automatically. This [service principal](https://docs.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals) allows Azure AD to authenticate your app.
   
   - After registering, the **Application ID** is available from the Overview tab. Copy and save it for later use.
   - Click the **Certificates & secrets** tab.
   - Under **Cliente secrets** click **New client secret**.
   - In the **Add a client secret** window, enter a description, specify when you want the client secret to expire, and click **Add**.
   - Copy and save the Client secret value.
   
     > After you leave this window, the client secret value will be hidden, and you'll not be able to view it or copy it again.
   
3. Add a platform:

   In our case, we'll be using the same app registration for authentication:
   
   - Go to the registered Azure AD application.
   - Under **Manage**, select **Authentication** and then on **Platform configurations** select **Add a platform** and then **Web**.
   - Under **Redirect URIs**, select **Add URI**, and then enter https://localhost:44321/signin-oidc
   - Under **Implicit grant**, select **ID tokens** and **Access token**.
   - Select **Save**.
   
4. Create an Azure AD Security Group:

   You need to be signed in with a Global administration account on Azure Portal.
   - Search for and select **Azure Active Directory**.
   - On the **Active Directory** page, select **Groups** and then select **New group**.
   - The New Group pane will appear and you must fill out the required information.
   - Select a pre-defined **Group type**.
   - Create and add a **Group name**.
   - Add a **Group email address** for the group, or keep the email address that is filled in automatically.
   - **Group description**. Add an optional description to your group.
   - Select a pre-defined **Membership type (required)**.
   - Select **Create**. Your group is created and ready for you to add members.
   
5. Enable the Power BI service admin settings:

   - To allow our Azure AD app to access our Power BI content and APIs, a Power BI admin needs to enable *Service Principal access* in the **Power BI admin portal**.
   - Enter the created Security Group in the *Apply to specific security groups (Recommended)* section in **Developer settings**.
   
6. Add the service principal to your workspace:

   - Scroll to the workspace you want to enable access for and select **Workspace access**.
   - Add the Service Principal as an **Admin** or **Member**.
   
7. Open the solution of this sample application on Visual Studio and complete the configurations on the *appsettings.json* file:

   > You can get the **Workspace Id** from the workspace URL: app.powerbi.com/groups/**<workspace_id>**/… The rest of the settings should be filled using the Azure AD application credentials.

```json
{
    "AzureADSignIn": {
        "Instance": "https://login.microsoftonline.com/", 
        "TenantId": "{tenant_id}",
        "ClientId": "{client_id}"
    },
    "AzureADPowerBI": {
        "Instance": "https://login.microsoftonline.com/",
        "TenantId": "{tenant_id}",
        "ClientId": "{client_id}",
        "ClientSecret": "{client_secret}",
        "ResourceUri": "https://analysis.windows.net/powerbi/api"
    },
    "PowerBI": {
        "PowerBIApi": "https://api.powerbi.com/",
        "WorkspaceId": "{workspace_id}"
    }
}
```

7. Once you have finished completing the *app.settings* you can go ahead and run the application.

For more information about these steps you can refer to the [Embed Power BI content with service principal and an application secret](https://docs.microsoft.com/en-us/power-bi/developer/embedded/embed-service-principal) tutorial.

# Sample application

## Authentication

As we mentioned earlier, this sample project consists of an ASP.NET Core MVC application that embeds Power BI content, but it also authenticates users. For that matter, it uses sign-in with Microsoft (bear in mind that [any other provider like Google or Facebook could be used instead](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/social/?view=aspnetcore-3.1&tabs=visual-studio)), that means that the user will be prompted for his Azure Active Directory credentials, and then asked to consent to the permissions our app requires. You can follow the [Microsoft Quickstart](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-v2-aspnet-core-webapp) to understand how the login process works.

## Embed Power BI content

Embedding Power BI content within our application requires getting an **access token** for our service principal from Azure AD. We need to get an [Azure AD access token](https://docs.microsoft.com/en-us/power-bi/developer/embedded/get-azuread-access-token#access-token-for-non-power-bi-users-app-owns-data) for the Power BI application before making calls to the Power BI REST APIs. Once we get that access token, we'll able to generate an **embed token**, which is the one that will be attached each time we embed one or multiple items from our content.

## How this sample works

All the necessary configurations that the application consumes in order to authenticate users and embed Power BI reports are located on the *app.settings* on the sample web app:

* **AzureADSignIn**: Configurations for the single sign-on.

* **AzureADPowerBI**: Configurations of the service principal to connect to the Power BI REST APIs.

* **PowerBI**: Contains the workspace ID where the reports are hosted and settings for generating the embed tokens. *"TokenForMultipleReports": true* enforce a single token for every report and *"SafetyIntervalInMinutes": 5* generates a new token 5 minutes before it expires.

**AzureADSignIn** options are needed just to authenticate users. In order to do so, the Microsoft.AspNetCore.Authentication middleware uses the following code on the Startup class which is executed when the hosting process initializes:

```csharp
 public void ConfigureServices(IServiceCollection services)
  {
      services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
          .AddMicrosoftIdentityWebApp(Configuration.GetSection("AzureADSignIn")

      services.AddControllersWithViews(options =>
      {
          var policy = new AuthorizationPolicyBuilder()
              .RequireAuthenticatedUser()
              .Build();
          options.Filters.Add(new AuthorizeFilter(policy));
      });
      services.AddRazorPages()
          .AddMicrosoftIdentityUI();
  }
```

**AzureADPowerBI** and **PowerBI** settings are required to [generate an access token](https://docs.microsoft.com/en-us/power-bi/developer/embedded/get-azuread-access-token#access-token-with-service-principal) through the *Microsoft.IdentityModel.Clients.ActiveDirectory* package. After we get the access token we can work with the APIs using the [.NET Client library for Power BI](https://github.com/microsoft/PowerBI-CSharp/tree/master/sdk), this SDK simplify the interaction with the public REST endpoints.

One of the first things we want to do with this client before embeding content is to get a reference to the item we want to embed (report, dashboard, tile, etc.), and there are a couple of endpoints to do so:

* [Reports - Get Reports In Group](https://docs.microsoft.com/en-us/rest/api/power-bi/reports/getreportsingroup): Returns a list of reports from the specified workspace.
* [Reports - Get Pages In Group](https://docs.microsoft.com/en-us/rest/api/power-bi/reports/getpagesingroup): Returns a list of pages within the specified report from the specified workspace.

The complete list of endpoints [can be found here](https://docs.microsoft.com/en-us/rest/api/power-bi/). The following is a brief example of how you can use the **access token** to then call the REST API and get a reference to a list of reports:

```csharp
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using Microsoft.Rest;
using Microsoft.PowerBI.Api.V2;
using Microsoft.PowerBI.Api.V2.Models;

...

var tokenCredentials = new TokenCredentials(authenticationResult.AccessToken, "Bearer");

// Create a Power BI Client object. it's used to call Power BI APIs.
using (var client = new PowerBIClient(new Uri(ApiUrl), tokenCredentials))
{
    var reports = await client.Reports.GetReportsInGroupAsync(workspaceId);

    // List of reports
    var reportList = reports.Value;
}
```

Now that our application can retrieve information about Power BI, we can provide our users with a navigation menu where they can see all the reports listed. Here is an example of how our sample lists them on the side panel, showing the report name as a parent element and the report pages as children of it:

```html
@model IEnumerable<Demo.Web.Models.PBIReport>

<div class="container">
    <div class="row">
        <!-- sidebar -->
        <div class="col-sm-3">
        @foreach (var pbiReport in Model)
        {
            var report = pbiReport.Report;
            var pages = pbiReport.Pages;

            <a href="#report_@report.Id" data-toggle="collapse" class="list-group-item list-group-item-action">
                <span>@report.Name</span>
            </a>

            <div id="report_@report.Id" class="page-container collapse">
            @foreach (var reportPage in pages)
            { 
                <a href="#" class="item-page" onclick="loadReport('report-container', '@report.Id', '@reportPage.Name')">@reportPage.DisplayName</a> 
            }
            </div>
        }
        </div>
    </div>
</div>
```

So far we were able to get access to the content items, but not to embed them. To be able to do so we need to [create the embed token](https://docs.microsoft.com/en-us/power-bi/developer/embedded/embed-sample-for-customers#create-the-embed-token) we mentioned earlier, these will let us display our reports into our view. [There a couple of ways of generating them](https://docs.microsoft.com/en-us/power-bi/developer/embedded/embed-sample-for-customers#create-the-embed-token), the following is an example of how you can generate one embed token for multiple items:

```csharp
// Example: generate an embed token for multiple reports
using Microsoft.PowerBI.Api.V2;
using Microsoft.PowerBI.Api.V2.Models;

...

var reports = new List<GenerateTokenRequestV2Report>()
{ 
    new GenerateTokenRequestV2Report()
    {
        Id = report1.Id
    },
    new GenerateTokenRequestV2Report()
    {
        Id = report2.Id
    }
};

var datasets = new List<GenerateTokenRequestV2Dataset>()
{
    new GenerateTokenRequestV2Dataset(dataset1.Id),
    new GenerateTokenRequestV2Dataset(dataset2.Id)
};

var targetWorkspaces = new List<GenerateTokenRequestV2TargetWorkspace>()
{
    new GenerateTokenRequestV2TargetWorkspace(workspace1.Id)
};

var request = new GenerateTokenRequestV2()
{
    Datasets = datasets,
    Reports = reports,
    TargetWorkspaces = targetWorkspaces,
};

var tokenResponse = client.GetClient().EmbedToken.GenerateToken(request);

// Send this object to the front-end to embed the report.
var embedConfig = new EmbedConfig()
{
    EmbedToken = tokenResponse,
    EmbedUrl = report1.embedUrl,
    Id = report1.Id
}
```
> Because we are still building our solution, there is no need to adquire a capacity to generate [unlimited embed tokens](https://docs.microsoft.com/en-us/power-bi/developer/embedded/embedded-faq#how-many-embed-tokens-can-i-create), but it's important to note that on development testing using a service principal or master account we can only generate a limited number of them. A very useful endpoint to pay attention to while developing is the [Available Features](https://docs.microsoft.com/en-us/rest/api/power-bi/availablefeatures/getavailablefeatures) one, this endpoint tells us how much is the percentage of the free embed tokens that we have consumed.

We are now ready to load the reports into our HTML. To do this, Microsoft provides the [JavaScript API](https://github.com/Microsoft/PowerBI-JavaScript/wiki/Embed-Configuration-Details), a library that easily manipulates the behaviour of the embedded content. The following JavaScript code shows how to embed the Power BI report inside an HTML element  *containerId*, through **loadReport()**. This function is responsible of:
- Loading the report including the page selected (if any).
- Loading other pages within the same report.

```js
// custom-embed.js

/**
 * @param {string}  containerId Identifier of the HTML element where the report will be embedded.
 * @param {string}  reportId    Report ID to be embedded.
 * @param {string}  pageId      [optional] Page section with which the report starts.
 * @param {any[]}   filters     [optional] [{ table: <tableName>, column: <columnName>, values: <values> }, ...]
 */
function loadReport(containerId, reportId, pageId = null, filters = []) {...}
```

This function consumes **generateEmbedToken()**, which makes the request to our backend and get the **embed URL** and **embed token**:

```js
/**
 * @param {string}   reportId           Report ID.
 * @param {Function} successCallback    Callback function.
 * @param {Function} errorCallback      Callback function.
 */
function _generateEmbedToken(reportId, successCallback, errorCallback) {...}
```

Once those parameters are obtained, we can finally use **embedReport()**. This function creates a [configuration object](https://github.com/microsoft/PowerBI-JavaScript/wiki/Embed-Configuration-Details) with those parameters and then embeds the report into the HTML element using the ```powerbi.embed()``` function from the Javascript API:

```js
/**
 * @param {any}         embedData   Object that contains the information to embed a report.
 * @param {HTMLElement} container   Element to embed the report.
 * @param {string}      pageId      [optional] Page section with which the report starts.
 * @param {any[]}       filters     [optional] [{ table: <tableName>, column: <columnName>, values: <values> }, ...]
 */
function _embedReport(embedData, container, pageId = null, filters = []) {
    var models = window["powerbi-client"].models;

    var config = {
        type: "report",
        tokenType: models.TokenType.Embed,
        accessToken: embedData.embedToken,
        embedUrl: embedData.embedUrl,
        settings: {
            background: models.BackgroundType.Transparent,
            filterPaneEnabled: false,
            navContentPaneEnabled: false
        }
    };

    if (pageId) {
        config["pageName"] = pageId;
    }

    report = powerbi.embed(container, config);

    report.off("loaded");
    report.on("loaded", function () {
        _setTokenExpirationListener(embedData.expiresOn, embedData.safetyIntervalInMinutes, embedData.reportId, container);
    });

    ...
}
```

As can be seen, every time a report is embedded, an instance of that content item is returned. This is useful for manipulating the behavior of the report we've embedded, for instance:

- [Add, update and remove filters](https://github.com/Microsoft/PowerBI-JavaScript/wiki/Filters) (for visuals, pages and reports)
- [Reload a report](https://github.com/Microsoft/PowerBI-JavaScript/wiki/Embedding-Basic-interactions#reload-a-report)
- [Register functions for specific events](https://github.com/microsoft/PowerBI-JavaScript/wiki/Handling-Events)
- and [more](https://github.com/microsoft/PowerBI-JavaScript/wiki)

As long as the *embed token* is valid we can keep interacting with the reports, but it's necessary to renew the embed token before it expires. The **setTokenExpirationListener()** function calculates when the token should be renewed and then, when that period has ended, the **updateEmbedToken()** is triggered:

```js
/**
 * @param {string}      tokenExpiration     Token expiration (ISO 8601).
 * @param {number}      minutesToRefresh    Minutes before token expires, request a new embed token.
 * @param {string}      reportId            Report ID.
 * @param {HTMLElement} container           Element that contains the report embedded.
 */
function _setTokenExpirationListener(tokenExpiration, minutesToRefresh, reportId, container) {...}
```

The **updateEmbedToken()** function requests a new embed token to our server and then updates the token of the report instance.

```js
/**
 * @param {string}      reportId    Report ID.
 * @param {HTMLElement} container   Element that contains the report embedded.
 */
function _updateEmbedToken(reportId, container) {...}
```

## Handling the hyperlink events

If you followed our article on Medium - [Linking reports on Power BI Embedded](https://medium.com/@hernan.demczuk/c8509b8540f1) - you already know that we can make use of Power BI Javascript SDK to manipulate what happens after the user clicks on visualization's hyperlinks too. To be able to filter a report based on an URL and also update the slicers on the target report, we must add the *hyperlinkClickBehavior* setting in our embed configuration. There are 3 types of options to do this:

- **Navigate**: Clicked URL is loaded in a new browsing context.
- **NavigateAndRaiseEvent**: Clicked URL is loaded in a new browsing context, raising the *dataHyperlinkClicked* event.
- **RaiseEvent**: Prevents the default behavior, raising the *dataHyperlinkClicked* event.

We will use the **RaiseEvent** option since we want to avoid opening a new tab:

```js
function _embedReport(embedData, container, pageId = null, filters = []) {
    var models = window["powerbi-client"].models;

    var config = {
        type: "report",
        tokenType: models.TokenType.Embed,
        accessToken: embedData.embedToken,
        embedUrl: embedData.embedUrl,
        settings: {
            background: models.BackgroundType.Transparent,
            hyperlinkClickBehavior: models.HyperlinkClickBehavior.RaiseEvent,
            filterPaneEnabled: false,
            navContentPaneEnabled: false
        }
    };

    if (pageId) {
        config["pageName"] = pageId;
    }
    
    ...
}
```

Having that configuration in place, we implemente the logic that propagates the filters on the target report.

First, we need a function that executes the following steps on each slicer available on the page:

1- Retrieves the active page of the report.
2- Gets slicers from the active page.
3- Retrieves the state of each slicer.
4- Updates the states using the filter objects, if any.
5- [Optional] Keep the slicer states in a dictionary (variable) to propagate them on other reports - this feature can be seen on the right top section of the web application. 

This logic will be located on a function that we'll call *_initializeSlicer()*.

Then, we create a *_handleSlicerEvent()* function that processes each slicer state and saves it in a dictionary.

Last, we implement a *_handleHyperlinkEvent()* function that parses URLs that target other reports. This URL contains information about:
- Workspace ID
- Report ID
- Page ID
- [Optional] Filters (Tables, columns, values, and operators)

Each of the above functions will be triggered depending on the following events on the report:

**loaded**: When the report is loaded, page slicers (if any) will be initialized (at visual level) with filters (if any).
**dataSelected**: Any select event on a visual will be caught. In our case, we will only process events related to slicers.
**dataHyperlinkClicked**: We will use this event to catch the hyperlink events that target other reports.

```js
function _embedReport(embedData, container, pageId = null, filters = []) {
    ...

    // Embed Power BI report when Access token and Embed URL are available
    report = powerbi.embed(container, config);

    report.off("loaded");
    report.on("loaded", function () {
        log.debug("Report load successful");

        var filterObjects = filters.map(filter => _generateFilterObject(filter.table, filter.column, filter.values));

        _initializeSlicers(filterObjects);

        _setTokenExpirationListener(embedData.expiresOn, embedData.safetyIntervalInMinutes, embedData.reportId, container);
    });

    report.off("dataSelected");
    report.on("dataSelected", function (event) {
        if (event.detail.visual.type == "slicer") {
            _handleSlicerEvent(event.detail);
        }
    });

    report.off("dataHyperlinkClicked");
    report.on("dataHyperlinkClicked", function (event) {
        _handleHyperlinkEvent(event, container);
    });

    report.off("error");
    report.on("error", function (event) {
        log.error(event.detail.message);
    });
}
```

Below we can see the implementation details of the *_handleHyperlinkEvent()* function, that gets the filters passed along with the URL and loads the target report updating any necessary slicer on its way:

```js
function _handleHyperlinkEvent(event, container) {
    if (!event || !event.detail || !event.detail.url)
        return;

    // example https://app.powerbi.com/groups/<groudId>/reports/<reportId>/<pageId>?filter=Employee/City eq 'Snohomish'
    var regex = /https\:\/\/app\.powerbi\.com\/groups\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/reports\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/([A-za-z0-9]*)?(\?filter=.*)?/;
    var url = event.detail.url;
    var match = url.match(regex);
    // match = [ <url>, <groudId>, <reportId>, <pageId | optional>, <filters | optional> ]
    if (match.length > 1 && match[1] && match[2]) {
        var reportId = match[2];
        var pageId = match[3] ? match[3] : null;
        var queryString = match[4] ? match[4] : null;

        var filters = _parseFiltersFromQueryString(queryString);

        loadReport(container.id, reportId, pageId, filters);
    }
}

function _parseFiltersFromQueryString(queryString) {
    var filters = [];
  
    // code to parse query string -> [ { table: <tableName>, column: <columnName>, values: <valueArray> }, ... ]
  
    return filters;
}
```
