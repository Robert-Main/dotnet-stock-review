using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StockReview.Data;
using StockReview.Dtos.Stock;
using StockReview.Helpers;
using StockReview.Interfaces;
using StockReview.Mappers;
using StockReview.Models;

namespace StockReview.Repositories
{
    public class StockRepository : IStockRepository
    {
        private readonly ApplicationDbContext _context;

        public StockRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Stock>> GetAllStocksAsync(QueryObject query)
        {
            var stocks = _context.Stocks.Include(s => s.Comments).AsQueryable();
            if (!string.IsNullOrEmpty(query?.Symbol))
            {
                stocks = stocks.Where(s => s.Symbol.Contains(query.Symbol));
            }
            if (!string.IsNullOrEmpty(query?.CompanyName))
            {
                stocks = stocks.Where(s => s.CompanyName.Contains(query.CompanyName));
            }
            return await stocks.ToListAsync();
        }

        public async Task<Stock?> GetStockAsync(int id)
        {
            return await _context.Stocks.Include(s => s.Comments).FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<Stock?> GetStockWithCommentsAsync(int id)
        {
            return await _context.Stocks
                .Include(s => s.Comments)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<bool> StockExistsAsync(int id)
        {
            return await _context.Stocks.AnyAsync(s => s.Id == id);
        }

        public async Task<Stock> AddStockAsync(CreateStock createStockDto)
        {
            var stock = createStockDto.MapToCreateStock();
            await _context.Stocks.AddAsync(stock);
            await _context.SaveChangesAsync();
            return stock;
        }

        public async Task<Stock?> UpdateStockAsync(int id, UpdateStock updateStockDto)
        {
            var stock = await _context.Stocks.FindAsync(id);
            if (stock == null) return null;

            updateStockDto.MapToUpdateStock(stock);
            await _context.SaveChangesAsync();
            return stock;
        }

        public async Task<Stock?> DeleteStockAsync(int id)
        {
            var stock = await _context.Stocks.FindAsync(id);
            if (stock == null) return null;

            _context.Stocks.Remove(stock);
            await _context.SaveChangesAsync();
            return stock;
        }


    }
}