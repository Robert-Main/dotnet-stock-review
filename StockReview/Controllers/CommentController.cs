using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using StockReview.Dtos.Comment;
using StockReview.Interfaces;
using StockReview.Mappers;

namespace StockReview.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentController : ControllerBase
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IStockRepository _stockRepository;

        public CommentController(ICommentRepository commentRepository, IStockRepository stockRepository)
        {
            _commentRepository = commentRepository;
            _stockRepository = stockRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllComments()
        {
            var comments = await _commentRepository.GetAllCommentsAsync();
            return Ok(new
            {
                success = true,
                message = "Comments retrieved successfully",
                data = comments
            });
        }

        [HttpGet("{stockId:int}")]
        public async Task<IActionResult> GetCommentsByStockId(int stockId)
        {
            var comments = await _commentRepository.GetCommentsByStockIdAsync(stockId);
            return Ok(new
            {
                success = true,
                message = "Comments retrieved successfully",
                data = comments
            });
        }

        [HttpPost]
        public async Task<IActionResult> AddComment([FromBody] CreateCommentDto createCommentDto)
        {
            if (createCommentDto == null)
            {
                return BadRequest(new { success = false, message = "Request body is required." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (createCommentDto.StockId == null)
            {
                return BadRequest(new { success = false, message = "StockId is required." });
            }

            var stock = await _stockRepository.GetStockAsync(createCommentDto.StockId.Value);
            if (stock == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Stock not found"
                });
            }

            var comment = await _commentRepository.AddCommentAsync(createCommentDto);
            return Ok(new
            {
                success = true,
                message = "Comment added successfully",
                data = CommentMappers.MapToCommentDto(comment)
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateComment(int id, [FromBody] UpdateCommentDto updateCommentDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var comment = await _commentRepository.UpdateCommentAsync(id, updateCommentDto);
            if (comment == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Comment not found"
                });
            }

            return Ok(new
            {
                success = true,
                message = "Comment updated successfully",
                data = CommentMappers.MapToCommentDto(comment)
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            var comment = await _commentRepository.DeleteCommentAsync(id);
            if (comment == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Comment not found"
                });
            }

            return Ok(new
            {
                success = true,
                message = "Comment deleted successfully",
                data = CommentMappers.MapToCommentDto(comment)
            });
        }
    }
}