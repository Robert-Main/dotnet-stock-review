using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Dtos.Stock;
using StockReview.Models;

namespace StockReview.Interfaces
{
    public interface IFMPInterface
    {
        Task<Stock> FindStockBySymbolAsync(string symbol);
        Task<FMPQuote> GetQuoteAsync(string symbol);
        Task<List<FMPHistoryPoint>> GetHistoricalPricesAsync(string symbol, int days);
        Task<List<FMPStockSearchResult>> SearchStocksAsync(string query, int limit);
    }
}