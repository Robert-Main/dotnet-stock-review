using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace StockReview.Helpers
{
    public static class ApiResponse
    {
        public static object Error(string message, object? errors = null)
        {
            return errors == null
                ? new { success = false, message }
                : new { success = false, message, errors };
        }

        public static object FromModelState(ModelStateDictionary modelState)
        {
            var errors = modelState
                .Where(kv => kv.Value?.Errors.Count > 0)
                .ToDictionary(
                    kv => kv.Key,
                    kv => kv.Value!.Errors.Select(e => e.ErrorMessage).ToArray());

            var first = errors.SelectMany(kv => kv.Value).FirstOrDefault();
            return Error(first ?? "Validation failed.", errors);
        }
    }
}
