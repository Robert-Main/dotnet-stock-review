using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StockReview.Interfaces;
using StockReview.Models;
using StockReview.Repositories;

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

        public PortfolioController(UserManager<AppUser> userManager, IStockRepository stockRepository, IPortfolioInterface portfolioInterface)
        {
            _userManager = userManager;
            _stockRepository = stockRepository;
            _portfolioInterface = portfolioInterface;
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

        [HttpPost("add")]
        public async Task<IActionResult> AddToPortfolio(string symbol)
        {
            var username = User.GetUserName();
            var user = await _userManager.FindByNameAsync(username);

            if (user == null)
            {
                return Unauthorized();
            }

            var stock = await _stockRepository.GetStockBySymbolAsync(symbol);
            if (stock == null)
            {
                return NotFound($"Stock with symbol {symbol} not found.");
            }

            var userPortfolio = await _portfolioInterface.GetUserPortfolioAsync(user);

            var portfolioModel = new Portfolio
            {
                StockId = stock.Id,
                AppUserId= user.Id
            };

            await _portfolioInterface.CreatePortfolioAsync(portfolioModel);
            if(portfolioModel == null)
            {
                return StatusCode(500,"Could nor create");
            };
            return Ok(
                new
                {
                    success=true,
                    message= "Portfolio craeted succefully",
                    portfolio = portfolioModel
                }
            );
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