using System;

namespace Demo.Web.Models
{
    public class EmbedParams
    {
        public string ReportId { get; set; }

        public string EmbedToken { get; set; }

        public DateTime ExpiresOn { get; set; }

        public string EmbedUrl { get; set; }

        public int SafetyIntervalInMinutes { get; set; }
    }
}
