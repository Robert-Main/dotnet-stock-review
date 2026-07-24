using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using StockReview.Dtos.Comment;

namespace StockReview.Dtos.Stock
{
    public class StockDtos
    {
        public int Id  {get; set;}
        public string? Symbol { get; set; }
        public string? CompanyName {get;set;}
        public decimal Purchase { get; set; }
        public decimal Divided { get; set; }
        public decimal LastDiv { get; set; }
        public string? Industry { get; set; }
        public long MarketCap { get; set; }
        public List<CommentDto> Comments { get; set; } = new List<CommentDto>();
    }
}