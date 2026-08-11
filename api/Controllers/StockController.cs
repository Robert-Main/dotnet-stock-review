using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockReview.Dtos.Stock;
using StockReview.Helpers;
using StockReview.Interfaces;
using StockReview.Mappers;

namespace StockReview.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StockController : ControllerBase
    {
        private readonly IStockRepository _stockRepository;
        private readonly IFMPInterface _fmpService;

        public StockController(IStockRepository stockRepository, IFMPInterface fmpService)
        {
            _stockRepository = stockRepository;
            _fmpService = fmpService;
        }

        [HttpGet("live")]
        public async Task<IActionResult> GetLiveQuotes([FromQuery] string symbols)
        {
            if (string.IsNullOrWhiteSpace(symbols))
            {
                return BadRequest(ApiResponse.Error("Symbols are required."));
            }

            var list = symbols.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct()
                .Take(20)
                .ToList();

            var fetched = await Task.WhenAll(list.Select(s => _fmpService.GetQuoteAsync(s)));
            var quotes = fetched
                .Where(q => q != null)
                .Select(q => new
                {
                    q.symbol,
                    q.name,
                    q.price,
                    q.change,
                    q.changePercentage,
                    q.marketCap,
                    q.dayHigh,
                    q.dayLow
                })
                .ToList();

            return Ok(new
            {
                success = true,
                message = "Live quotes retrieved successfully",
                data = quotes
            });
        }

        [HttpGet("history/{symbol}")]
        public async Task<IActionResult> GetHistory([FromRoute] string symbol, [FromQuery] int days = 30)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest(ApiResponse.Error("Symbol is required."));
            }

            var points = await _fmpService.GetHistoricalPricesAsync(symbol, days);
            return Ok(new
            {
                success = true,
                message = "Historical prices retrieved successfully",
                data = points.Select(p => new { p.date, p.price }).ToList()
            });
        }

        // Live-market search for the "Add from live market" picker. Runs
        // against the bundled PopularStocks index (FMP's own search endpoints
        // are paid-tier on the free key). The index is stocks-only, so no
        // type filtering or dedupe is needed.
        [HttpGet("search")]
        public async Task<IActionResult> SearchLiveStocks([FromQuery] string query, [FromQuery] int limit = 8)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(ApiResponse.Error("Query is required."));
            }

            var hits = await _fmpService.SearchStocksAsync(query, limit);
            var stocks = hits
                .Select(h => new
                {
                    h.symbol,
                    h.name,
                    h.exchange,
                    h.exchangeShortName
                })
                .ToList();

            return Ok(new
            {
                success = true,
                message = "Live stocks retrieved successfully",
                data = stocks
            });
        }

        // Add a stock straight from live FMP data (quote-backed), skipping the
        // manual form entirely. Idempotent: if the symbol already exists it is
        // returned untouched so the UI can navigate to it instead of creating a
        // duplicate.
        [HttpPost("from-live")]
        public async Task<IActionResult> AddFromLive([FromBody] FromLiveDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse.FromModelState(ModelState));
            }

            var symbol = dto.Symbol.Trim().ToUpperInvariant();
            var existing = await _stockRepository.GetStockBySymbolAsync(symbol);
            if (existing != null)
            {
                return Ok(new
                {
                    success = true,
                    message = $"{symbol} is already on the platform",
                    created = false,
                    stock = existing.MapToStockDtos()
                });
            }

            var live = await _fmpService.FindStockBySymbolAsync(symbol);
            if (live == null)
            {
                return NotFound(ApiResponse.Error($"No live data found for symbol '{symbol}'."));
            }

            var createStock = new CreateStock
            {
                Symbol = live.Symbol.ToUpperInvariant(),
                CompanyName = live.CompanyName,
                Purchase = live.Purchase,
                Divided = live.Divided,
                LastDiv = live.LastDiv,
                Industry = live.Industry,
                MarketCap = live.MarketCap,
                Sector = "Unknown"
            };

            var created = await _stockRepository.AddStockAsync(createStock);
            return Ok(new
            {
                success = true,
                message = $"{created.Symbol} added from the live market",
                created = true,
                stock = created.MapToStockDtos()
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetStocks([FromQuery] QueryObject query)
        {
            var stocks = await _stockRepository.GetAllStocksAsync(query);
            var stockDtos = stocks.Select(s => s.MapToStockDtos()).ToList();

            return Ok(new
            {
                success = true,
                message = "Stocks retrieved successfully",
                Stocks = stockDtos
            });
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetStock(int id)
        {
            var stock = await _stockRepository.GetStockWithCommentsAsync(id);
            if (stock == null)
            {
                return NotFound(ApiResponse.Error("Stock not found"));
            }

            return Ok(new
            {
                success = true,
                message = "Stock retrieved successfully",
                Stock = stock.MapToStockDtos()
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateStock([FromBody] CreateStock createStock)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse.FromModelState(ModelState));
            }
            var stock = createStock.MapToCreateStock();
            var created = await _stockRepository.AddStockAsync(createStock);

            return CreatedAtAction(
                nameof(GetStock),
                new { id = created.Id },
                created
            );
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateStock([FromRoute] int id, [FromBody] UpdateStock updateStockDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse.FromModelState(ModelState));
            }
            var stock = await _stockRepository.UpdateStockAsync(id, updateStockDto);
            if (stock == null)
            {
                return NotFound(ApiResponse.Error("Stock not found"));
            }

            return Ok(new
            {
                success = true,
                message = "Stock updated successfully",
                Stock = stock.MapToStockDtos()
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteStock([FromRoute] int id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse.FromModelState(ModelState));
            }
            var stock = await _stockRepository.DeleteStockAsync(id);
            if (stock == null)
            {
                return NotFound(ApiResponse.Error("Stock not found"));
            }

            return Ok(new
            {
                success = true,
                message = "Stock deleted successfully"
            });
        }
    }
}