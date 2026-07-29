using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StockReview.Interfaces;
using StockReview.Models;

namespace StockReview.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PortfolioController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IStockRepository _stockRepository;

        public PortfolioController(UserManager<AppUser> userManager, IStockRepository stockRepository)
        {
            _userManager = userManager;
            _stockRepository = stockRepository;
        }
    }
}