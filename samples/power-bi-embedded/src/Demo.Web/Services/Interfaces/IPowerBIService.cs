using System.Collections.Generic;
using System.Threading.Tasks;
using Demo.Web.Models;

namespace Demo.Web.Services.Interfaces
{
    public interface IPowerBIService
    {
        Task<IEnumerable<PBIReport>> GetReportsAsync();

        Task<EmbedParams> GetEmbedParamsForReportAsync(string reportId);
    }
}
