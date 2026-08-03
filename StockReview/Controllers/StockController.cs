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

        // Live quotes for a comma-separated list of symbols ("AAPL,MSFT").
        // Returns quotes that resolved; failures are skipped so a single bad
        // symbol never breaks the whole dashboard.
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

            // Fetch all symbols in parallel — the FMP round-trip dominates
            // latency, and a sequential loop would stall the dashboard.
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

        // Historical EOD prices (oldest-first) for a sparkline.
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