using System.Threading.Tasks;

namespace Demo.Web.Services.Interfaces
{
    public interface IAzureADService
    {
        Task<string> GetAccessTokenAsync(bool forceUpdate = false);
    }
}
