using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using StockReview.Dtos.Comment;
using StockReview.Models;

namespace StockReview.Interfaces
{
    public interface ICommentRepository
    {
        Task<List<CommentDto>> GetAllCommentsAsync();
        Task<List<CommentDto>> GetCommentsByStockIdAsync(int stockId);
        Task<Comment> AddCommentAsync(CreateCommentDto createCommentDto);
        Task<Comment?> UpdateCommentAsync(int id, UpdateCommentDto updateCommentDto);
        Task<Comment?> DeleteCommentAsync(int id);
    }
}