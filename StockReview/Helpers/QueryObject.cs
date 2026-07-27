using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace StockReview.Helpers
{
    public class QueryObject
    {
        public string? Symbol { get; set; }
        public string? CompanyName { get; set; }

        public string? SortBy   { get; set; }
        public string? SortOrder { get; set; }
        public bool IsDecending {get; set; } = false;
    }
}