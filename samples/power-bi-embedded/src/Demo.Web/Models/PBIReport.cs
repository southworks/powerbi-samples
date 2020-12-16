using System.Collections.Generic;
using Microsoft.PowerBI.Api.Models;

namespace Demo.Web.Models
{
    public class PBIReport
    {
        public Report Report { get; set; }

        public IEnumerable<Page> Pages { get; set; }
    }
}
