using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StockReview.Models;

namespace StockReview.Data
{
    public class ApplicationDbContext : IdentityDbContext<AppUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {

        }
        public DbSet<Stock> Stocks { get; set; }
        public DbSet<Comment> Comments { get; set; }

         protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            List<IdentityRole> roles = new List<IdentityRole>
            {
                new IdentityRole
                {
                    Id = "bbcdcd82-02b4-4021-8b0f-6185ef8dcd0b",
                    Name = "Admin",
                    NormalizedName = "ADMIN",
                    ConcurrencyStamp = "142030af-311e-4811-bd86-7b35e6a738ee"
                },
                new IdentityRole
                {
                    Id = "8bd15299-83c4-4e10-b942-6b488e4e8c6f",
                    Name = "User",
                    NormalizedName = "USER",
                    ConcurrencyStamp = "8bb432d3-1665-4cfe-88c6-8ee99fb0821b"
                }
            };

            builder.Entity<IdentityRole>().HasData(roles);
        }
    }
}