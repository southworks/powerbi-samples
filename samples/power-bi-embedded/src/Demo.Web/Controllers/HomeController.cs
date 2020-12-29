using System.Diagnostics;
using Demo.Web.Models.ViewModel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Demo.Web.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger logger;

        public HomeController(ILogger<HomeController> logger)
        {
            this.logger = logger;
        }

        public IActionResult Index()
        {
            return this.View();
        }

        [AllowAnonymous]
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            var requestId = Activity.Current?.Id ?? this.HttpContext.TraceIdentifier;

            var exceptionDetails = this.HttpContext.Features.Get<IExceptionHandlerFeature>();

            if (exceptionDetails != null)
            {
                var exception = exceptionDetails.Error;
                var message = exception.Message;

                this.logger.LogError(message);
            }

            return this.View(new ErrorViewModel { RequestId = requestId, Message = "An unexpected error occurred." });
        }
    }
}
