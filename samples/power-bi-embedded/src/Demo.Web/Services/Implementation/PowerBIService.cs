using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Demo.Web.Configuration;
using Demo.Web.Models;
using Demo.Web.Services.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.PowerBI.Api;
using Microsoft.PowerBI.Api.Models;
using Microsoft.Rest;

namespace Demo.Web.Services.Implementation
{
    public class PowerBIService : IPowerBIService
    {
        private readonly PowerBIOptions powerBIOptions;
        private readonly IAzureADService azureADService;
        private IList<PBIReport> pbiReports;
        private EmbedToken groupEmbedToken;
        private ConcurrentDictionary<string, EmbedToken> embedTokentDict;

        public PowerBIService(IOptions<PowerBIOptions> powerBIOptions, IAzureADService azureADService)
        {
            this.powerBIOptions = powerBIOptions.Value;
            this.azureADService = azureADService;
            this.embedTokentDict = new ConcurrentDictionary<string, EmbedToken>();
        }

        public async Task<IEnumerable<PBIReport>> GetReportsAsync()
        {
            if (this.pbiReports == null)
            {
                try
                {
                    var accessToken = await this.azureADService.GetAccessTokenAsync();
                    var client = this.CreatePowerBIClient(accessToken);
                    var groupId = new Guid(this.powerBIOptions.WorkspaceId);

                    var reportsInGroup = await client.Reports.GetReportsInGroupAsync(groupId);
                    this.pbiReports = reportsInGroup.Value.Select(r => new PBIReport() { Report = r }).ToList();

                    foreach (var pbiReport in this.pbiReports)
                    {
                        var pagesInGroup = await client.Reports.GetPagesInGroupAsync(groupId, pbiReport.Report.Id);
                        pbiReport.Pages = pagesInGroup.Value.Where(page => !page.DisplayName.StartsWith("_"));
                    }
                }
                catch (HttpOperationException ex)
                {
                    throw new Exception($"Error while connecting to '{ex.Source}': '{ex.Response.Content}'", ex);
                }
            }

            return this.pbiReports;
        }

        public async Task<EmbedParams> GetEmbedParamsForReportAsync(string reportId)
        {
            var allPBIReports = await this.GetReportsAsync();
            var pbiReport = allPBIReports.FirstOrDefault(r => r.Report.Id.ToString() == reportId);

            if (pbiReport == null)
            {
                return null;
            }

            EmbedParams embedParams = null;
            var tokenForMultipleReports = this.powerBIOptions.TokenForMultipleReports;

            var pbiReportList = tokenForMultipleReports ? allPBIReports : new List<PBIReport>() { pbiReport };

            var embedToken = await this.GetEmbedTokenForReportsAsync(pbiReportList);

            if (!tokenForMultipleReports)
            {
                this.embedTokentDict[reportId] = embedToken;
            }

            embedParams = new EmbedParams()
            {
                ReportId = reportId,
                EmbedToken = embedToken.Token,
                ExpiresOn = embedToken.Expiration,
                EmbedUrl = pbiReport.Report.EmbedUrl,
                SafetyIntervalInMinutes = this.powerBIOptions.SafetyIntervalInMinutes
            };

            return embedParams;
        }

        private PowerBIClient CreatePowerBIClient(string accessToken)
        {
            var tokenCredentials = new TokenCredentials(accessToken, "Bearer");
            var client = new PowerBIClient(new Uri(this.powerBIOptions.PowerBIApi), tokenCredentials);

            return client;
        }

        private GenerateTokenRequestV2 CreateTokenRequestForReports(IEnumerable<PBIReport> pbiReports)
        {
            var requestReports = pbiReports.Select(pbiReport => new GenerateTokenRequestV2Report() { Id = pbiReport.Report.Id }).ToList();
            var requestDatasets = pbiReports.GroupBy(pbiReport => pbiReport.Report.DatasetId)
                                    .Select(group => new GenerateTokenRequestV2Dataset(group.First().Report.DatasetId)).ToList();
            var requestWorkspaces = new List<GenerateTokenRequestV2TargetWorkspace>()
            {
                new GenerateTokenRequestV2TargetWorkspace(new Guid(this.powerBIOptions.WorkspaceId)),
            };

            var request = new GenerateTokenRequestV2()
            {
                Reports = requestReports,
                Datasets = requestDatasets,
                TargetWorkspaces = requestWorkspaces
            };

            return request;
        }

        private async Task<EmbedToken> GetEmbedTokenForReportsAsync(IEnumerable<PBIReport> pbiReports)
        {
            var tokenForMultipleReports = this.powerBIOptions.TokenForMultipleReports;
            var embedToken = this.groupEmbedToken;

            if (!tokenForMultipleReports)
            {
                var pbiReport = pbiReports.FirstOrDefault();
                var reportId = pbiReport.Report.Id.ToString();
                embedToken = this.embedTokentDict.ContainsKey(reportId) ? this.embedTokentDict[reportId] : null;
            }

            if (this.EmbedTokenHasExpired(embedToken))
            {
                var request = this.CreateTokenRequestForReports(pbiReports);
                var forceUpdate = embedToken != null;
                var accessToken = await this.azureADService.GetAccessTokenAsync(forceUpdate);
                var client = this.CreatePowerBIClient(accessToken);
                embedToken = await client.EmbedToken.GenerateTokenAsync(request);

                if (tokenForMultipleReports)
                {
                    this.groupEmbedToken = embedToken;
                }
            }

            return embedToken;
        }

        private bool EmbedTokenHasExpired(EmbedToken token)
        {
            var safetyInterval = this.powerBIOptions.SafetyIntervalInMinutes;
            var tokenExpiration = token?.Expiration.AddMinutes(-safetyInterval);
            var now = DateTime.UtcNow;

            return token == null || tokenExpiration <= now;
        }
    }
}
