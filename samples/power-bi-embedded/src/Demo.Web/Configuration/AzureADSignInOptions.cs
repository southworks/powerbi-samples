﻿using System.ComponentModel.DataAnnotations;
using Demo.Web.Services.Interfaces;

namespace Demo.Web.Configuration
{
    public class AzureADSignInOptions : IValidatable
    {
        [Required]
        [Url]
        public string Instance { get; set; }

        [Required]
        public string TenantId { get; set; }

        [Required]
        public string ClientId { get; set; }

        public void Validate()
        {
            Validator.ValidateObject(this, new ValidationContext(this), validateAllProperties: true);
        }
    }
}
