using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using StockReview.Data;
using StockReview.Helpers;
using StockReview.Interfaces;
using StockReview.Models;
using StockReview.Repositories;
using StockReview.Services;

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);
builder.Host.ConfigureAppConfiguration((hostingContext, config) =>
{
    config.Sources.Clear();
    config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: false);
    config.AddJsonFile($"appsettings.{hostingContext.HostingEnvironment.EnvironmentName}.json", optional: true, reloadOnChange: false);
    config.AddEnvironmentVariables();
    if (args is not null)
    {
        config.AddCommandLine(args);
    }
});

builder.Services.AddOpenApi();
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore
);
// Disable the framework's automatic 400 (ProblemDetails {title,status,errors,
// traceId}) so ModelState validation errors flow through ApiResponse and every
// error body is the consistent { success, message, errors? } shape. Controllers
// already check ModelState.IsValid explicitly.
builder.Services.Configure<ApiBehaviorOptions>(options =>
    options.SuppressModelStateInvalidFilter = true
);
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddCors(options =>
{
    // Read allowed origins from configuration (or env var) so production
    // domains can be injected by the host (Vercel/Render) without code changes.
    // Format: a semicolon-separated list, e.g.
    // AllowedOrigins="http://localhost:3000;https://your-vercel-app.vercel.app"
    var allowed = builder.Configuration["AllowedOrigins"] ?? "http://localhost:3000;https://localhost:3000";
    var origins = allowed.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    options.AddPolicy("AllowNextJs", policy =>
    {
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddScoped<IStockRepository, StockRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPortfolioInterface, PortfolioRepository>();
builder.Services.AddHttpClient<IFMPInterface,IFMPService>();
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});

builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
}).AddEntityFrameworkStores<ApplicationDbContext>().AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "JwtBearer";
    options.DefaultChallengeScheme = "JwtBearer";
    options.DefaultScheme = "JwtBearer";
    options.DefaultSignInScheme = "JwtBearer";
    options.DefaultSignOutScheme = "JwtBearer";
    options.DefaultForbidScheme = "JwtBearer";
}).AddJwtBearer("JwtBearer", options =>
{
    var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key configuration is required.");
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

var app = builder.Build();

// Global exception handler — must be FIRST so it wraps the whole pipeline.
// Any unhandled exception becomes a canonical { success: false, message }
// 500; the real exception is logged server-side, never sent to the client.
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;

        var logger = context.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("GlobalExceptionHandler");
        logger.LogError(exception, "Unhandled exception while processing {Method} {Path}",
            context.Request.Method, context.Request.Path);

        // The handler clears the response, so re-apply the CORS header for the
        // same origins the AllowNextJs policy allows — otherwise the browser
        // blocks reading the error body on cross-origin requests.
        var origin = context.Request.Headers["Origin"].ToString();
        var allowed = builder.Configuration["AllowedOrigins"] ?? "http://localhost:3000;https://localhost:3000";
        var allowedOrigins = allowed.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (!string.IsNullOrEmpty(origin) && allowedOrigins.Contains(origin))
        {
            context.Response.Headers["Access-Control-Allow-Origin"] = origin;
            context.Response.Headers["Vary"] = "Origin";
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json; charset=utf-8";

        var body = ApiResponse.Error("An unexpected error occurred while processing your request.");
        await context.Response.WriteAsync(JsonSerializer.Serialize(body));
    });
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors("AllowNextJs");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

app.Run();