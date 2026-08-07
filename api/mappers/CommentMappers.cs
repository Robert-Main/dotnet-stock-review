using System;
using StockReview.Dtos.Comment;
using StockReview.Models;

namespace StockReview.Mappers
{
    public static class CommentMappers
    {
        public static CommentDto MapToCommentDto(Comment comment)
        {
            return new CommentDto
            {
                Id = comment.Id,
                StockId = comment.StockId,
                Title = comment.Title,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                CreatedBy = comment.AppUser?.UserName
            };
        }

        public static Comment MapToCreateComment(CreateCommentDto createCommentDto)
        {
            return new Comment
            {
                StockId = createCommentDto.StockId,
                Title = createCommentDto.Title,
                Content = createCommentDto.Content,
            };
        }

        public static void MapToUpdateComment(UpdateCommentDto updateCommentDto, Comment comment)
        {
            comment.Title = updateCommentDto.Title;
            comment.Content = updateCommentDto.Content;
        }
    }
}