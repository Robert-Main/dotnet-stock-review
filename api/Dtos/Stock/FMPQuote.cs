namespace api.Dtos.Stock
{
    // Live quote returned by the FMP "quote" endpoint.
    public class FMPQuote
    {
        public string symbol { get; set; }
        public string name { get; set; }
        public double price { get; set; }
        public double change { get; set; }
        public double changePercentage { get; set; }
        public long marketCap { get; set; }
        public double previousClose { get; set; }
        public double dayHigh { get; set; }
        public double dayLow { get; set; }
        public string exchange { get; set; }
    }

    // One point of historical EOD price data.
    public class FMPHistoryPoint
    {
        public string date { get; set; }
        public double price { get; set; }
    }

    // One hit from the FMP "/stable/search" endpoint — the live-market
    // universe used by the "Add from live market" picker.
    public class FMPStockSearchResult
    {
        public string symbol { get; set; }
        public string name { get; set; }
        public string exchange { get; set; }
        public string exchangeShortName { get; set; }
        public string type { get; set; }
    }
}
