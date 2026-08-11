namespace api.Dtos.Stock
{
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

    public class FMPHistoryPoint
    {
        public string date { get; set; }
        public double price { get; set; }
    }
    public class FMPStockSearchResult
    {
        public string symbol { get; set; }
        public string name { get; set; }
        public string exchange { get; set; }
        public string exchangeShortName { get; set; }
        public string type { get; set; }
    }
}
