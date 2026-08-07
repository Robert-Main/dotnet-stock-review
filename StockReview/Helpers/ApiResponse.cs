using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace StockReview.Helpers
{
    // Single envelope for every API response (Newtonsoft camelCase serializes
    // these as { success, message, errors? }).
    //
    //   Success: { success = true,  message, data? }
    //   Error:   { success = false, message, errors? }
    //
    // Controllers MUST go through this helper instead of returning ad-hoc
    // anonymous objects or plain strings, so the frontend can rely on one shape.
    public static class ApiResponse
    {
        public static object Error(string message, object? errors = null)
        {
            return errors == null
                ? new { success = false, message }
                : new { success = false, message, errors };
        }

        // Flatten ModelState into { field: ["message", ...] } and surface the
        // first field error as the top-level message so clients always get a
        // useful message even without parsing the errors bag.
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
