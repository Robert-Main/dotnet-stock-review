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
using StockReview.Helpers;
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

        // No try/catch here on purpose: unhandled exceptions propagate to the
        // global exception middleware, which logs them server-side and returns
        // the canonical { success: false, message } 500 without leaking details.
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (model == null)
            {
                return BadRequest(ApiResponse.Error("Request body is required."));
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse.FromModelState(ModelState));
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
                    return BadRequest(ApiResponse.Error("Error assigning role to user", roleResult.Errors.Select(e => e.Description).ToArray()));
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

            return BadRequest(ApiResponse.Error("Error creating user", MapIdentityErrors(result.Errors)));
        }

        // Identity errors don't carry field names, but their codes identify the
        // property they belong to (PasswordTooShort/DuplicateUserName/...). Map
        // them into the field-keyed errors bag so the frontend can render
        // messages under the right input instead of a single alert.
        private static Dictionary<string, string[]> MapIdentityErrors(IEnumerable<IdentityError> errors)
        {
            var bag = new Dictionary<string, List<string>>();
            foreach (var error in errors)
            {
                var field = error.Code switch
                {
                    "DuplicateUserName" or "InvalidUserName" => "Username",
                    "DuplicateEmail" or "InvalidEmail" => "Email",
                    _ when error.Code.StartsWith("Password") => "Password",
                    _ => "Errors",
                };
                if (!bag.TryGetValue(field, out var list))
                {
                    list = new List<string>();
                    bag[field] = list;
                }
                list.Add(error.Description);
            }
            return bag.ToDictionary(kv => kv.Key, kv => kv.Value.ToArray());
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            if (model == null)
            {
                return BadRequest(ApiResponse.Error("Request body is required."));
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse.FromModelState(ModelState));
            }

            var user = await _userManager.Users.FirstOrDefaultAsync(u => u.Email == model.Email.ToLower());
            if (user == null)
            {
                return BadRequest(ApiResponse.Error("Invalid email or password."));
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: false);
            if (!result.Succeeded)
            {
                return BadRequest(ApiResponse.Error("Invalid email or password."));
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
    }
}