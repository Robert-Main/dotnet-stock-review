using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StockReview.Dtos.Stock;
using StockReview.Interfaces;
using StockReview.Models;
using StockReview.Repositories;
using StockReview.Services;

namespace StockReview.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PortfolioController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IStockRepository _stockRepository;
        private readonly IPortfolioInterface _portfolioInterface;
        private readonly IFMPInterface _iFMPService;

        public PortfolioController(UserManager<AppUser> userManager, IStockRepository stockRepository, IPortfolioInterface portfolioInterface, IFMPInterface iFMPService)
        {
            _userManager = userManager;
            _stockRepository = stockRepository;
            _portfolioInterface = portfolioInterface;
            _iFMPService = iFMPService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPortfolio()
        {
            var username = User.GetUserName();
            var user = await _userManager.FindByNameAsync(username);

            if (user == null)
            {
                return Unauthorized();
            }

            var portfolio = await _portfolioInterface.GetUserPortfolioAsync(user);
            return Ok(portfolio);
        }

        [HttpPost("add/{symbol:alpha}")]
        public async Task<IActionResult> AddToPortfolio([FromRoute] string symbol)
        {
            var username = User.GetUserName();
            var user = await _userManager.FindByNameAsync(username);

            if (user == null)
            {
                return Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest("Symbol is required.");
            }

            var stock = await _stockRepository.GetStockBySymbolAsync(symbol);
            if (stock == null)
            {
                stock = await _iFMPService.FindStockBySymbolAsync(symbol);
                if (stock == null)
                {
                    return BadRequest("Stock does not exist.");
                }

                var createStock = new StockReview.Dtos.Stock.CreateStock
                {
                    Symbol = stock.Symbol,
                    CompanyName = stock.CompanyName,
                    Purchase = stock.Purchase,
                    Divided = stock.Divided,
                    LastDiv = stock.LastDiv,
                    Industry = stock.Industry,
                    MarketCap = stock.MarketCap,
                    Sector = "Unknown"
                };

                stock = await _stockRepository.AddStockAsync(createStock);
            }

            var portfolioModel = new Portfolio
            {
                StockId = stock.Id,
                AppUserId = user.Id
            };

            var createdPortfolio = await _portfolioInterface.CreatePortfolioAsync(portfolioModel);
            if (createdPortfolio == null)
            {
                return StatusCode(500, "Could not create portfolio item.");
            }

            return Ok(new
            {
                success = true,
                message = "Portfolio item created successfully",
                portfolio = createdPortfolio
            });
        }

        [HttpDelete("")]
        public async Task<IActionResult> DeletePrtfolio(string symbol)
        {
            var username = User.GetUserName();
            var appUser = await _userManager.FindByNameAsync(username);

            var userPortfolio = await _portfolioInterface.GetUserPortfolioAsync(appUser);

            var fillteredStock =userPortfolio.Where(s=>s.Symbol.ToLower() ==symbol.ToLower()).ToList();
            if(fillteredStock.Count() == 1)
            {
                await _portfolioInterface.deletePortifolio(appUser,symbol);
            }
            else
            {
                return BadRequest("Stock not in your portfolio");
            }
            return Ok(
                new
                {
                    success =true,
                    message= "Portfolio deleted succesfully"
                }
            );
        }
    }
}