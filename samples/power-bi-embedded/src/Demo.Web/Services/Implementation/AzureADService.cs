using System;
using System.Threading.Tasks;
using Demo.Web.Configuration;
using Demo.Web.Services.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Clients.ActiveDirectory;

namespace Demo.Web.Services.Implementation
{
    public class AzureADService : IAzureADService
    {
        private readonly AzureADAppOptions azureADAppOptions;
        private AuthenticationResult authenticationData;

        public AzureADService(IOptions<AzureADAppOptions> azureADAppOptions)
        {
            this.azureADAppOptions = azureADAppOptions.Value;
        }

        public async Task<string> GetAccessTokenAsync(bool forceUpdate = false)
        {
            if (forceUpdate || this.TokenHasExpired())
            {
                var authorityUri = this.azureADAppOptions.Instance + this.azureADAppOptions.TenantId;
                var authenticationContext = new AuthenticationContext(authorityUri);
                var credential = new ClientCredential(this.azureADAppOptions.ClientId, this.azureADAppOptions.ClientSecret);

                this.authenticationData = await authenticationContext.AcquireTokenAsync(this.azureADAppOptions.ResourceUri, credential);
            }

            return this.authenticationData.AccessToken;
        }

        private bool TokenHasExpired()
        {
            // The ExpiresOn property of the AuthenticationResult class defines the expiration date of the issued token in UTC.
            return this.authenticationData == null || this.authenticationData.ExpiresOn <= DateTime.UtcNow;
        }
    }
}
