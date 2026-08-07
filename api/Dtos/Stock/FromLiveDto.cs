using System.ComponentModel.DataAnnotations;

namespace StockReview.Dtos.Stock
{
    public class FromLiveDto
    {
        [Required]
        [MaxLength(10, ErrorMessage = "Symbol cannot exceed 10 characters.")]
        public string? Symbol { get; set; }
    }
}
