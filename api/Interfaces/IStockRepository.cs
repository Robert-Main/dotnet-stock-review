using System.Collections.Generic;
using System.Threading.Tasks;
using StockReview.Dtos.Stock;
using StockReview.Helpers;
using StockReview.Models;

namespace StockReview.Interfaces
{
    public interface IStockRepository
    {
        Task<List<Stock>> GetAllStocksAsync(QueryObject query);
        Task<Stock?> GetStockAsync(int id);
        Task<Stock?> GetStockBySymbolAsync(string symbol);
        Task<Stock?> GetStockWithCommentsAsync(int id);
        Task<bool> StockExistsAsync(int id);
        Task<Stock> AddStockAsync(CreateStock createStockDto);
        Task<Stock?> UpdateStockAsync(int id, UpdateStock updateStockDto);
        Task<Stock?> DeleteStockAsync(int id);
    }
}