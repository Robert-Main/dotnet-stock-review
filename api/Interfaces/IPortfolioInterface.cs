using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using StockReview.Models;

namespace StockReview.Interfaces
{
    public interface IPortfolioInterface
    {
        public Task<List<Stock>> GetUserPortfolioAsync(AppUser user);
        public Task<Portfolio> CreatePortfolioAsync(Portfolio portfolio);
        public Task<Portfolio> DeletePortfolioAsync(AppUser appUser, string symbol);
    }
}