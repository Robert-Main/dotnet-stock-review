using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StockReview.Data;
using StockReview.Interfaces;
using StockReview.Models;

namespace StockReview.Repositories
{
    public class PortfolioRepository : IPortfolioInterface
    {
        private readonly ApplicationDbContext _context;
        public PortfolioRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Portfolio> CreatePortfolioAsync(Portfolio portfolio)
        {
            await _context.Portfolios.AddAsync(portfolio);
            await _context.SaveChangesAsync();
            return portfolio;
        }

        public async Task<Portfolio> deletePortifolio(AppUser appUser ,string symbol)
        {
            var portfolios = await _context.Portfolios.FirstOrDefaultAsync(x => x.AppUserId==appUser.Id && x.Stock.Symbol.ToLower()== symbol.ToLower());
            if(portfolios == null)
            {
                return null;
            }
            _context.Portfolios.Remove(portfolios);
            await _context.SaveChangesAsync();
            return portfolios;
        }

        public async Task<List<Stock>> GetUserPortfolioAsync(AppUser user)
        {
            return await _context.Portfolios.Where(u => u.AppUserId == user.Id).Select(p => new Stock
            {
                Id = p.Stock.Id,
                Symbol = p.Stock.Symbol,
                CompanyName = p.Stock.CompanyName,
                Purchase = p.Stock.Purchase,
                Divided = p.Stock.Divided,
                LastDiv = p.Stock.LastDiv,
                Industry = p.Stock.Industry,
                MarketCap = p.Stock.MarketCap
            }).ToListAsync();
        }


    }
}