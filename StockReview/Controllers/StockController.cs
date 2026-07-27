using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using StockReview.Dtos.Stock;
using StockReview.Interfaces;
using StockReview.Mappers;

namespace StockReview.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StockController : ControllerBase
    {
        private readonly IStockRepository _stockRepository;

        public StockController(IStockRepository stockRepository)
        {
            _stockRepository = stockRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetStocks()
        {
            var stocks = await _stockRepository.GetStocksAsync();
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
                return NotFound(new
                {
                    success = false,
                    message = "Stock not found",
                });
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
                return BadRequest(ModelState);
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
                return BadRequest(ModelState);
            }
            var stock = await _stockRepository.UpdateStockAsync(id, updateStockDto);
            if (stock == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Stock not found",
                });
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
                return BadRequest(ModelState);
            }
            var stock = await _stockRepository.DeleteStockAsync(id);
            if (stock == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Stock not found",
                });
            }

            return Ok(new
            {
                success = true,
                message = "Stock deleted successfully"
            });
        }
    }
}