using System;
using System.Net;
using System.Threading.Tasks;
using Demo.Web.Models.Errors;
using Demo.Web.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Web.Controllers
{
    public class ReportController : Controller
    {
        private readonly IPowerBIService powerBIService;

        public ReportController(IPowerBIService powerBIService)
        {
            this.powerBIService = powerBIService;
        }

        [HttpGet]
        public async Task<IActionResult> GetEmbedParams(string reportId)
        {
            try
            {
                var embedParams = await this.powerBIService.GetEmbedParamsForReportAsync(reportId);
                if (embedParams == null)
                {
                    var message = $"Report with Id '{reportId}' not found.";
                    var error = new EmbedParamsError(message);

                    return this.NotFound(error);
                }

                return this.Ok(embedParams);
            }
            catch (Exception)
            {
                var message = $"An error ocurred when obtaining the parameters to embed the report with Id '{reportId}'.";
                var error = new EmbedParamsError(message);
                var statusCode = (int)HttpStatusCode.InternalServerError;

                return this.StatusCode(statusCode, error);
            }
        }
    }
}
