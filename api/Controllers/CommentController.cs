using System.Threading.Tasks;
using api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StockReview.Dtos.Comment;
using StockReview.Dtos.Stock;
using StockReview.Helpers;
using StockReview.Interfaces;
using StockReview.Mappers;
using StockReview.Models;
using StockReview.Services;

namespace StockReview.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentController : ControllerBase
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IStockRepository _stockRepository;
        private readonly UserManager<AppUser> _userManager;
        private readonly IFMPInterface _iFMPService;

        public CommentController(ICommentRepository commentRepository, IStockRepository stockRepository, UserManager<AppUser> userManager, IFMPInterface iFMPService)
        {
            _commentRepository = commentRepository;
            _stockRepository = stockRepository;
            _userManager = userManager;
            _iFMPService = iFMPService;
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
                return NotFound(ApiResponse.Error("Comment not found"));

            return Ok(new
            {
                success=true,
                message="comment retrived succeefully",
                comment
            });
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
        [Route("{symbol:regex(^[[A-Za-z0-9.\\-]]+$)}")]
        public async Task<IActionResult> Create([FromRoute] string symbol, [FromBody] CreateCommentDto createCommentDto)
        {
            if (createCommentDto == null)
            {
                return BadRequest(ApiResponse.Error("Request body is required."));
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse.FromModelState(ModelState));
            }

            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest(ApiResponse.Error("Stock symbol is required."));
            }

            var stock = await _stockRepository.GetStockBySymbolAsync(symbol);
            if (stock == null)
            {
                var remoteStock = await _iFMPService.FindStockBySymbolAsync(symbol);
                if (remoteStock == null)
                {
                    return NotFound(ApiResponse.Error("Stock not found"));
                }

                stock = await _stockRepository.AddStockAsync(new CreateStock
                {
                    Symbol = remoteStock.Symbol,
                    CompanyName = remoteStock.CompanyName,
                    Purchase = remoteStock.Purchase,
                    Divided = remoteStock.Divided,
                    LastDiv = remoteStock.LastDiv,
                    Industry = remoteStock.Industry,
                    MarketCap = remoteStock.MarketCap,
                    Sector = "Unknown"
                });

            }

            createCommentDto.StockId = stock.Id;

            var username = User.GetUserName();
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized(ApiResponse.Error("Authenticated user is required."));
            }

            var appUser = await _userManager.FindByNameAsync(username);
            if (appUser == null)
            {
                return Unauthorized(ApiResponse.Error("Authenticated user not found."));
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

        // Resolve the authenticated AppUser id from the JWT. The token carries
        // GivenName (username) but no nameidentifier claim, so we look the user
        // up by name — the same pattern Create uses. Returns null if anonymous
        // or the user no longer exists.
        private async Task<string?> GetCurrentUserIdAsync()
        {
            var username = User.GetUserName();
            if (string.IsNullOrEmpty(username)) return null;

            var appUser = await _userManager.FindByNameAsync(username);
            return appUser?.Id;
        }

        private bool IsOwner(Comment comment, string appUserId)
        {
            return string.Equals(comment.AppUserId, appUserId, StringComparison.OrdinalIgnoreCase);
        }

        [Authorize]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateComment(int id, [FromBody] UpdateCommentDto updateCommentDto)
        {
            if (updateCommentDto == null)
            {
                return BadRequest(ApiResponse.Error("Request body is required."));
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse.FromModelState(ModelState));
            }

            var appUserId = await GetCurrentUserIdAsync();
            if (appUserId == null)
            {
                return Unauthorized(ApiResponse.Error("Authenticated user is required."));
            }

            var comment = await _commentRepository.GetCommentEntityByIdAsync(id);
            if (comment == null)
            {
                return NotFound(ApiResponse.Error("Comment not found"));
            }

            if (!IsOwner(comment, appUserId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error("You can only edit your own comments."));
            }

            var updated = await _commentRepository.UpdateCommentAsync(id, updateCommentDto);
            if (updated == null)
            {
                return NotFound(ApiResponse.Error("Comment not found"));
            }

            return Ok(new
            {
                success = true,
                message = "Comment updated successfully",
                data = CommentMappers.MapToCommentDto(updated)
            });
        }

        [Authorize]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            var appUserId = await GetCurrentUserIdAsync();
            if (appUserId == null)
            {
                return Unauthorized(ApiResponse.Error("Authenticated user is required."));
            }

            var comment = await _commentRepository.GetCommentEntityByIdAsync(id);
            if (comment == null)
            {
                return NotFound(ApiResponse.Error("Comment not found"));
            }

            if (!IsOwner(comment, appUserId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Error("You can only delete your own comments."));
            }

            var deleted = await _commentRepository.DeleteCommentAsync(id);
            if (deleted == null)
            {
                return NotFound(ApiResponse.Error("Comment not found"));
            }

            return Ok(new
            {
                success = true,
                message = "Comment deleted successfully",
                data = CommentMappers.MapToCommentDto(deleted)
            });
        }
    }
}