using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace StockReview.Helpers
{
    public class QueryObject
    {
        private int _pageNumber = 1;
        private int _pageSize = 10;

        public string? Symbol { get; set; }
        public string? CompanyName { get; set; }
        public string? SortBy { get; set; }
        public bool IsDescending { get; set; } = false;

        public int MaxPageSize { get; set; } = 100;

        public int PageNumber
        {
            get => _pageNumber;
            set => _pageNumber = value < 1 ? 1 : value;
        }

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = value < 1 ? 10 : Math.Min(value, MaxPageSize);
        }

        public int Skip => (PageNumber - 1) * PageSize;
        public int Take => PageSize;
    }
}