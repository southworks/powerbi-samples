Summary
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

1. Have a workspace with reports on it. If you don't have any pbix file, you can try out [one of the samples Microsoft provides](https://docs.microsoft.com/en-us/power-bi/create-reports/sample-datasets#sales--returns-sample-pbix-file).
2. [Register an Azure AD application](https://docs.microsoft.com/en-us/power-bi/developer/embedded/embed-service-principal#step-1---create-an-azure-ad-app) and create an app secret. In order to delegate Identity and Access Management functions to Azure AD, an application must be registered with an Azure AD tenant. In this step we can also specify where the access token is sent to, by setting the *redirect URI*. Once we register the Azure AD application, **a service principal is created** automatically.
3. [Add sign-in with Microsoft](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-v2-aspnet-core-webapp#option-2-register-and-manually-configure-your-application-and-code-sample). In our case, we'll be using the same app registration for authentication. Go the registered Azure AD app and under *Manage* click on *Authentication*. Under *Redirect URIs*, select *Add URI*, and then enter https://localhost:44386/signin-oidc. Under *Implicit grant*, select *ID tokens* and *Access token*.
4. [Create an Azure AD security group](https://docs.microsoft.com/en-us/power-bi/developer/embedded/embed-service-principal#step-2---create-an-azure-ad-security-group) and add the service principal from the Azure AD app to that security group. 
5. [Enable the Power BI service admin settings](https://docs.microsoft.com/en-us/power-bi/developer/embedded/embed-service-principal#step-3---enable-the-power-bi-service-admin-settings). A Power BI admin needs to *Allow service principals to user Power BI APIs* in the *Power BI Admin portal* and enter the security group created before.
6. [Add the service principal to your workspace](https://docs.microsoft.com/en-us/power-bi/developer/embedded/embed-service-principal#step-4---add-the-service-principal-to-your-workspace) to be member or admin. This will allow our application to access our workspace content.
7. Using the Azure AD application credentials, complete the values on the *app.settings* file of this sample application:

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

Review some [Considerations and limitations](https://docs.microsoft.com/en-us/power-bi/developer/embedded/embed-service-principal#considerations-and-limitations) about embeding Power BI content with service principal. 

# Sample application

## Authentication

As we mentioned earlier, this sample project consists of an ASP.NET Core MVC application that embeds Power BI content, but it also authenticates users. For that matter, it uses sign-in with Microsoft (bear in mind that [any other provider like Google or Facebook could be used instead](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/social/?view=aspnetcore-3.1&tabs=visual-studio)), that means that the user will be prompted for his Azure Active Directory credentials, and then asked to consent to the permissions our app requires. You can follow the [Microsoft Quickstart](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-v2-aspnet-core-webapp) to understand how the login process works.

## Embed Power BI content

Embedding Power BI content within our application requires getting an **access token** for our service principal from Azure AD. We need to get an [Azure AD access token](https://docs.microsoft.com/en-us/power-bi/developer/embedded/get-azuread-access-token#access-token-for-non-power-bi-users-app-owns-data) for the Power BI application before making calls to the Power BI REST APIs. Once we get that access token, we'll able to generate an **embed token**, which is the one that will be attached each time we embed one or multiple items from our content.

## How this sample works

All the necessary configurations that the application consumes in order to authenticate users and embed Power BI reports are located on the *app.settings*:

* **AzureADSignIn**: Configurations for the single sign-on.

* **AzureADPowerBI**: Configurations to generate the AzureAD access token.

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
