using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace StockReview.Dtos.Stock
{
    public class UpdateStock
    {
        public string? Symbol { get; set; }
        public string? CompanyName {get;set;}
        public decimal Purchase { get; set; }
        public decimal Divided { get; set; }
        public decimal LastDiv { get; set; }
        public string? Industry { get; set; }
        public long MarketCap { get; set; }

    }
}