using System.Threading.Tasks;
using api.Extensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StockReview.Dtos.Comment;
using StockReview.Interfaces;
using StockReview.Mappers;
using StockReview.Models;

namespace StockReview.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentController : ControllerBase
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IStockRepository _stockRepository;
        private readonly UserManager<AppUser> _userManager;

        public CommentController(ICommentRepository commentRepository, IStockRepository stockRepository, UserManager<AppUser> userManager)
        {
            _commentRepository = commentRepository;
            _stockRepository = stockRepository;
            _userManager = userManager;
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
        [HttpGet("comment/{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var comment = await _commentRepository.GetCommentByIdAsync(id);
            if (comment == null)
                return NotFound();

            return Ok(comment);
        }

        [HttpGet("stock/{stockId:int}")]
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
            var username = User.GetUserName();
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized(new { success = false, message = "Authenticated user is required." });
            }

            var appUser = await _userManager.FindByNameAsync(username);
            if (appUser == null)
            {
                return Unauthorized(new { success = false, message = "Authenticated user not found." });
            }

            var comment = await _commentRepository.AddCommentAsync(createCommentDto, appUser.Id);
            comment.AppUser = appUser;
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