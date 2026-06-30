using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace StockReview.Models
{
    public class Comment
    {
        public int? Id { get; set; }
        public int? StockId { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
        public DateTime CreatedAt { get; set; }= DateTime.Now;
        public Stock?  Stock { get; set; }
    }
}