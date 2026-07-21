using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockReview.Data;
using StockReview.Models;
using StockReview.Mappers;
using StockReview.Dtos.Stock;


namespace StockReview.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StockController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StockController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetStocks()
        {
            var stocks = await _context.Stocks.ToListAsync();
            var stockDtos = stocks.Select(s => s.MapToStockDtos()).ToList();
            return Ok(new
            {
                success = true,
                message = "Stocks retrieved successfully",
                Stocks = stockDtos
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStock(int id)
        {
            var stock = await _context.Stocks.Include(s => s.Comments).FirstOrDefaultAsync(s => s.Id == id);
            if (stock == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "stock not found",
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
        public async Task<IActionResult> CreateStock([FromBody] CreateStock CreateStock)
        {
            var stock = CreateStock.MapToCreateStock();
            _context.Stocks.Add(stock);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetStock),
                new { id = stock.Id },
                 stock
                 );
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStock([FromRoute] int id, [FromBody] UpdateStock updateStockDtos)
        {
            var stock = await _context.Stocks.FindAsync(id);
            if (stock == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Stock not found",
                });
            }

            updateStockDtos.MapToUpdateStock(stock);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Stock updated successfully",
                Stock = stock.MapToStockDtos()
            });
        }

        [HttpDelete("{id}")]
        [Route("(id)")]
        public async Task<IActionResult> DeleteStock([FromRoute] int id)
        {
            var stock = await _context.Stocks.FindAsync(id);
            if (stock == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Stock not found",
                });
            }

            _context.Stocks.Remove(stock);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Stock deleted successfully"
            });
        }
    }
}