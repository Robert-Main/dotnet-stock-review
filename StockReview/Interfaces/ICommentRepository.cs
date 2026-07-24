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
        public Task<List<CommentDto>> GetAllCommentsAsync();
        public Task<List<CommentDto>> GetCommentsByStockIdAsync(int stockId);
        public Task<Comment> AddCommentAsync(CreateCommentDto createCommentDto);
        public Task<Comment?> UpdateCommentAsync(int id, UpdateCommentDto updateCommentDto);
        public Task<Comment?> DeleteCommentAsync(int id);

    }
}