using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using StockReview.Models;

namespace StockReview.Interfaces
{
    public interface IFMPInterface
    {
        Task<Stock> FindStockBySymbolAsync(string symbol);
    }
}