using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Dtos.Stock;
using Newtonsoft.Json;
using StockReview.Interfaces;
using StockReview.Models;

namespace StockReview.Services
{
    public class IFMPService : IFMPInterface
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        // The legacy /api/v3/* endpoints were retired (Aug 2025); FMP now serves
        // the current API under /stable/*. Keep short in-memory caches so we do
        // not hammer the (rate-limited) free tier on every dashboard render.
        private static readonly ConcurrentDictionary<string, (DateTime Expires, object Value)> _cache = new();
        private static readonly TimeSpan QuoteCacheTtl = TimeSpan.FromMinutes(1);
        private static readonly TimeSpan HistoryCacheTtl = TimeSpan.FromMinutes(5);

        public IFMPService(HttpClient httpClient, IConfiguration configuration)
        {
            _configuration = configuration;
            _httpClient = httpClient;
        }

        private string ApiKey =>
            // .env declares FMP_KEYS (DotNetEnv loads it as an env var); keep
            // FMPKey as a fallback for other setups.
            _configuration["FMP_KEYS"] ?? _configuration["FMPKey"] ?? string.Empty;

        // Opportunistically drop expired entries so the static cache stays
        // bounded (symbols can be added/removed at runtime, so keys are never
        // naturally retired). Called on each cache write.
        private static void PruneExpired()
        {
            var now = DateTime.UtcNow;
            foreach (var key in _cache.Keys)
            {
                if (_cache.TryGetValue(key, out var entry) && entry.Expires <= now)
                    _cache.TryRemove(key, out _);
            }
        }

        private async Task<T> GetJsonAsync<T>(string url) where T : class
        {
            try
            {
                using var result = await _httpClient.GetAsync(url);
                if (!result.IsSuccessStatusCode) return null;
                var content = await result.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<T>(content);
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                return null;
            }
        }

        public async Task<Stock> FindStockBySymbolAsync(string symbol)
        {
            var quote = await GetQuoteAsync(symbol);
            if (quote == null) return null;

            return new Stock
            {
                Symbol = quote.symbol ?? symbol,
                CompanyName = quote.name,
                Purchase = (decimal)quote.price,
                Divided = 0,
                LastDiv = 0,
                Industry = quote.exchange,
                MarketCap = quote.marketCap
            };
        }

        public async Task<FMPQuote> GetQuoteAsync(string symbol)
        {
            var cacheKey = $"quote:{symbol.ToUpperInvariant()}";
            if (_cache.TryGetValue(cacheKey, out var hit) && hit.Expires > DateTime.UtcNow)
                return (FMPQuote)hit.Value;

            var quotes = await GetJsonAsync<FMPQuote[]>(
                $"https://financialmodelingprep.com/stable/quote?symbol={Uri.EscapeDataString(symbol)}&apikey={ApiKey}");

            var quote = quotes?.FirstOrDefault();
            if (quote != null)
            {
                _cache[cacheKey] = (DateTime.UtcNow.Add(QuoteCacheTtl), quote);
                PruneExpired();
            }

            return quote;
        }

        public async Task<List<FMPHistoryPoint>> GetHistoricalPricesAsync(string symbol, int days)
        {
            if (days < 2) days = 2;
            if (days > 365) days = 365;

            var cacheKey = $"history:{symbol.ToUpperInvariant()}:{days}";
            if (_cache.TryGetValue(cacheKey, out var hit) && hit.Expires > DateTime.UtcNow)
                return (List<FMPHistoryPoint>)hit.Value;

            // Endpoint returns newest-first; the free tier does not honor the
            // "limit" param, so fetch and slice the tail.
            var all = await GetJsonAsync<FMPHistoryPoint[]>(
                $"https://financialmodelingprep.com/stable/historical-price-eod/light?symbol={Uri.EscapeDataString(symbol)}&apikey={ApiKey}");

            if (all == null || all.Length == 0) return new List<FMPHistoryPoint>();

            var sliced = all.Take(days).Reverse().ToList();
            _cache[cacheKey] = (DateTime.UtcNow.Add(HistoryCacheTtl), sliced);
            PruneExpired();
            return sliced;
        }

        public Task<List<FMPStockSearchResult>> SearchStocksAsync(string query, int limit)
        {
            // FMP's /stable/search and /stable/symbol/available-list are
            // paid-tier (return [] on the free key), so search runs against
            // the bundled PopularStocks index. Exact symbols not in the index
            // are still addable via POST /api/stock/from-live, which validates
            // against the free quote endpoint.
            var q = query?.Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(q)) return Task.FromResult(new List<FMPStockSearchResult>());
            if (limit < 1) limit = 1;
            if (limit > 20) limit = 20;

            var scored = new List<(FMPStockSearchResult Hit, int Score)>();
            foreach (var s in PopularStocks.All)
            {
                if (s.symbol == q)
                {
                    scored.Add((s, 4));
                    continue;
                }

                var nameUpper = s.name.ToUpperInvariant();
                var score = 0;
                if (s.symbol.StartsWith(q, StringComparison.Ordinal)) score = 3;
                else if (nameUpper.StartsWith(q, StringComparison.Ordinal)) score = 2;
                // Name-contains matches are gated to >= 3 chars so common
                // substrings like "co" or "in" don't flood the dropdown with
                // alphabetical ties.
                else if (q.Length >= 3 && nameUpper.Contains(q, StringComparison.Ordinal)) score = 1;
                if (score > 0) scored.Add((s, score));
            }

            return Task.FromResult(
                scored
                    .OrderByDescending(x => x.Score)
                    .ThenBy(x => x.Hit.symbol, StringComparer.Ordinal)
                    .Take(limit)
                    .Select(x => x.Hit)
                    .ToList());
        }
    }
}
