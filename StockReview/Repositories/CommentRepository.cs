using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StockReview.Data;
using StockReview.Dtos.Comment;
using StockReview.Interfaces;
using StockReview.Mappers;
using StockReview.Models;

namespace StockReview.Repositories
{
    public class CommentRepository : ICommentRepository
    {
        private readonly ApplicationDbContext _context;

        public CommentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public Task<List<CommentDto>> GetAllCommentsAsync()
        {
            return _context.Comments.Include(a => a.AppUser)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    StockId = c.StockId,
                    Title = c.Title,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.AppUser != null ? c.AppUser.UserName : null
                })
                .ToListAsync();
        }

        public Task<List<CommentDto>> GetCommentsByStockIdAsync(int stockId)
        {
            return _context.Comments.Include(a => a.AppUser)
                .Where(c => c.StockId == stockId)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    StockId = c.StockId,
                    Title = c.Title,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.AppUser != null ? c.AppUser.UserName : null
                })
                .ToListAsync();
        }

        public Task<CommentDto?> GetCommentByIdAsync(int id)
        {
            return _context.Comments.Include(c => c.AppUser)
                .Where(c => c.Id == id)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    StockId = c.StockId,
                    Title = c.Title,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt,
                    CreatedBy = c.AppUser != null ? c.AppUser.UserName : null
                })
                .FirstOrDefaultAsync();
        }

        public async Task<Comment> AddCommentAsync(CreateCommentDto createCommentDto, string appUserId)
        {
            var comment = CommentMappers.MapToCreateComment(createCommentDto);
            comment.AppUserId = appUserId;
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            return comment;
        }

        public async Task<Comment?> UpdateCommentAsync(int id, UpdateCommentDto updateCommentDto)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null) return null;

            CommentMappers.MapToUpdateComment(updateCommentDto, comment);
            await _context.SaveChangesAsync();
            return comment;
        }

        public async Task<Comment?> DeleteCommentAsync(int id)
        {
            var comment = await _context.Comments.FindAsync(id);
            if (comment == null) return null;

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
            return comment;
        }
    }
}