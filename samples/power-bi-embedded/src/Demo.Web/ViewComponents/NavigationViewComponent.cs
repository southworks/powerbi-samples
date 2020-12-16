using System.Threading.Tasks;
using Demo.Web.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Demo.Web.ViewComponents
{
    public class NavigationViewComponent : ViewComponent
    {
        private readonly IPowerBIService powerBIService;

        public NavigationViewComponent(IPowerBIService powerBIService)
        {
            this.powerBIService = powerBIService;
        }

        public async Task<IViewComponentResult> InvokeAsync()
        {
            var reports = await this.powerBIService.GetReportsAsync();

            return this.View(reports);
        }
    }
}
