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

        public CommentController(ICommentRepository commentRepository)
        {
            _commentRepository = commentRepository;
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

        [HttpGet("{stockId}")]
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
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var comment = await _commentRepository.AddCommentAsync(createCommentDto);
            return Ok(new
            {
                success = true,
                message = "Comment added successfully",
                data = CommentMappers.MapToCommentDto(comment)
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateComment(int id, [FromBody] UpdateCommentDto updateCommentDto)
        {
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

        [HttpDelete("{id}")]
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