using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace StockReview.Dtos.Stock
{
    public class CreateStock
    {
        [Required]
        [MaxLength(10, ErrorMessage = "Symbol cannot exceed 10 characters.")]
        public string? Symbol { get; set; }
        [Required]
        [MaxLength(100, ErrorMessage = "Company name cannot exceed 100 characters.")]
        public string? CompanyName {get;set;}
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Purchase price must be a positive number.")]
        public decimal Purchase { get; set; }
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Dividend must be a positive number.")]
        public decimal Divided { get; set; }
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Last dividend must be a positive number.")]
        public decimal LastDiv { get; set; }
        [Required]
        [MaxLength(100, ErrorMessage = "Industry cannot exceed 100 characters.")]
        public string? Industry { get; set; }
        [Required]
        [MaxLength(100, ErrorMessage = "Sector cannot exceed 100 characters.")]
        public string? Sector { get; set; }
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Market cap must be a positive number.")]
        public long MarketCap { get; set; }
    }
}