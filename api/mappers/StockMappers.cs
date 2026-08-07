using api.Dtos.Stock;
using StockReview.Dtos.Stock;
using StockReview.Models;

namespace StockReview.Mappers
{
    public static class StockMappers
    {
        public static StockDtos MapToStockDtos(this Stock stock)
        {
            return new StockDtos
            {
                Id = stock.Id,
                Symbol = stock.Symbol,
                CompanyName = stock.CompanyName,
                Purchase = stock.Purchase,
                Divided = stock.Divided,
                LastDiv = stock.LastDiv,
                Industry = stock.Industry,
                MarketCap = stock.MarketCap,
                Comments = stock.Comments.Select(CommentMappers.MapToCommentDto).ToList()
            };
        }

        public static Stock MapToCreateStock(this CreateStock createStock)
        {
            return new Stock
            {
                Symbol = createStock.Symbol,
                CompanyName = createStock.CompanyName,
                Purchase = createStock.Purchase,
                Divided = createStock.Divided,
                LastDiv = createStock.LastDiv,
                Industry = createStock.Industry,
                MarketCap = createStock.MarketCap
            };
        }
        public static Stock MapToUpdateStock(this UpdateStock updateStock, Stock stock)
        {
            stock.Symbol = updateStock.Symbol;
            stock.CompanyName = updateStock.CompanyName;
            stock.Purchase = updateStock.Purchase;
            stock.Divided = updateStock.Divided;
            stock.LastDiv = updateStock.LastDiv;
            stock.Industry = updateStock.Industry;
            stock.MarketCap = updateStock.MarketCap;

            return stock;
        }
         public static Stock ToStockFromFMP(this FMPStock fmpStock)
        {
            return new Stock
            {
                Symbol = fmpStock.symbol,
                CompanyName = fmpStock.companyName,
                Purchase = (decimal)fmpStock.price,
                LastDiv = (decimal)fmpStock.lastDiv,
                Industry = fmpStock.industry,
                MarketCap = fmpStock.mktCap
            };
        }
    }
}