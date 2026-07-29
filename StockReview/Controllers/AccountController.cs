using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockReview.Dtos;
using StockReview.Dtos.Account;
using StockReview.Interfaces;
using StockReview.Models;

namespace StockReview.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ITokenService _tokenService;

        public AccountController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, ITokenService tokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            try
            {
                if (model == null)
                {
                    return BadRequest(new { Message = "Request body is required." });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = new AppUser
                {
                    UserName = model.Username,
                    Email = model.Email
                };

                var result = await _userManager.CreateAsync(user, model.Password);
                if (result.Succeeded)
                {
                    var roleResult = await _userManager.AddToRoleAsync(user, "User");
                    if (!roleResult.Succeeded)
                    {
                        return BadRequest(new { Message = "Error assigning role to user", Errors = roleResult.Errors });
                    }
                    var token = await _tokenService.CreateTokenAsync(user);
                    return Ok(new
                    {
                        Message = "User created successfully",
                        Token = token,
                        user = new
                        {
                            user.Id,
                            user.UserName,
                            user.Email,
                        }
                    });
                }

                return BadRequest(new { Message = "Error creating user", Errors = result.Errors });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while processing your request.", Error = ex.Message });
            }

        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            try
            {
                if (model == null)
                {
                    return BadRequest(new { Message = "Request body is required." });
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Email == model.Email.ToLower());
                if (user == null)
                {
                    return BadRequest(new { Message = "Invalid email or password." });
                }

                var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: false);
                if (!result.Succeeded)
                {
                    return BadRequest(new { Message = "Invalid email or password." });
                }
                var token = await _tokenService.CreateTokenAsync(user);

                return Ok(new
                {
                    Message = "Login successful",
                    Token = token,
                    user = new
                    {
                        user.Id,
                        user.UserName,
                        user.Email
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while processing your request.", Error = ex.Message });
            }
        }
    }
}