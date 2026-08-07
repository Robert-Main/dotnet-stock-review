using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace StockReview.Dtos.Comment
{
    public class CreateCommentDto
    {
        public int? StockId { get; set; }

        [Required]
        [MaxLength(100, ErrorMessage = "Title cannot exceed 100 characters.")]
        [MinLength(1, ErrorMessage = "Title must be at least 1 character long.")]
        public string? Title { get; set; }

        [Required]
        [MaxLength(200, ErrorMessage = "Content cannot exceed 200 characters.")]
        [MinLength(1, ErrorMessage = "Content must be at least 1 character long.")]
        public string? Content { get; set; }
    }
}