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
            var stocks = _context.Stocks
                .Include(s => s.Comments)
                    .ThenInclude(c => c.AppUser)
                .AsQueryable();

            var symbol = query.Symbol;
            var companyName = query.CompanyName;

            // The frontend uses one search box that sends the same term as both
            // Symbol and CompanyName, so the filters must be ORed (match either
            // field), not ANDed. Each clause only contributes when its param is
            // non-empty — an empty param must NOT short-circuit the whole row.
            if (!string.IsNullOrEmpty(symbol) || !string.IsNullOrEmpty(companyName))
            {
                stocks = stocks.Where(s =>
                    (!string.IsNullOrEmpty(symbol) && s.Symbol != null && s.Symbol.Contains(symbol)) ||
                    (!string.IsNullOrEmpty(companyName) && s.CompanyName != null && s.CompanyName.Contains(companyName)));
            }

            if (!string.IsNullOrEmpty(query.SortBy))
            {
                if (query.SortBy.Equals("symbol", StringComparison.OrdinalIgnoreCase))
                {
                    stocks = query.IsDescending
                        ? stocks.OrderByDescending(s => s.Symbol)
                        : stocks.OrderBy(s => s.Symbol);
                }
                else if (query.SortBy.Equals("companyname", StringComparison.OrdinalIgnoreCase))
                {
                    stocks = query.IsDescending
                        ? stocks.OrderByDescending(s => s.CompanyName)
                        : stocks.OrderBy(s => s.CompanyName);
                }
            }

            return await stocks
                .Skip(query.Skip)
                .Take(query.Take)
                .ToListAsync();
        }

        public async Task<Stock?> GetStockAsync(int id)
        {
            return await _context.Stocks
                .Include(s => s.Comments)
                    .ThenInclude(c => c.AppUser)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<Stock?> GetStockBySymbolAsync(string symbol)
        {
            return await _context.Stocks.FirstOrDefaultAsync(s => s.Symbol == symbol);
        }

        public async Task<Stock?> GetStockWithCommentsAsync(int id)
        {
            return await _context.Stocks
                .Include(s => s.Comments)
                    .ThenInclude(c => c.AppUser)
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