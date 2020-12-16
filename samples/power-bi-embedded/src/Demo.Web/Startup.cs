using Demo.Web.Configuration;
using Demo.Web.Services.Implementation;
using Demo.Web.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Logging;

namespace Demo.Web
{
    public class Startup
    {
        public Startup(IWebHostEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true) // load base settings
                .AddJsonFile("local.settings.json", optional: true, reloadOnChange: true) // load local settings
                .AddEnvironmentVariables();

            this.Configuration = builder.Build();
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            IdentityModelEventSource.ShowPII = true;

            services.AddTransient<IStartupFilter, SettingValidationStartupFilter>();

            services.Configure<AzureADSignInOptions>(this.Configuration.GetSection("AzureADSignIn"));
            services.Configure<AzureADAppOptions>(this.Configuration.GetSection("AzureADPowerBI"));
            services.Configure<PowerBIOptions>(this.Configuration.GetSection("PowerBI"));

            // Register as an IValidatable
            services.AddSingleton<IValidatable>(
                resolver => resolver.GetRequiredService<IOptions<AzureADSignInOptions>>().Value);
            services.AddSingleton<IValidatable>(
                resolver => resolver.GetRequiredService<IOptions<AzureADAppOptions>>().Value);
            services.AddSingleton<IValidatable>(
                resolver => resolver.GetRequiredService<IOptions<PowerBIOptions>>().Value);

            services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
                .AddMicrosoftIdentityWebApp(this.Configuration.GetSection("AzureADSignIn"));

            services.AddControllersWithViews(options =>
            {
                AuthorizationPolicy policy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
                options.Filters.Add(new AuthorizeFilter(policy));
            });

            services.AddSingleton(
                e => this.Configuration.GetSection("ClientLogging")
                        .Get<ClientLoggingOptions>());
            services.AddSingleton<IAzureADService, AzureADService>();
            services.AddSingleton<IPowerBIService, PowerBIService>();
            services.AddControllersWithViews();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");

                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
