using System;
using System.ComponentModel.DataAnnotations;
using System.Configuration;
using Demo.Web.Services.Interfaces;

namespace Demo.Web.Configuration
{
    public class PowerBIOptions : IValidatable
    {
        [Required]
        [Url]
        public string PowerBIApi { get; set; }

        [Required]
        public string WorkspaceId { get; set; }

        public bool TokenForMultipleReports { get; set; }

        [IntegerValidator(MinValue = 0)]
        public int SafetyIntervalInMinutes { get; set; }

        public void Validate()
        {
            Validator.ValidateObject(this, new ValidationContext(this), validateAllProperties: true);

            if (!Guid.TryParse(this.WorkspaceId, out var newGuid))
            {
                throw new FormatException("The WorkspaceId field contains an invalid format.");
            }
        }
    }
}
