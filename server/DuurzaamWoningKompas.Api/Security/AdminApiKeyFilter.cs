using DuurzaamWoningKompas.Api.Dtos;
using DuurzaamWoningKompas.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace DuurzaamWoningKompas.Api.Security;

public sealed class AdminApiKeyFilter(IOptions<AdminAuthOptions> options, IHostEnvironment environment) : IAsyncAuthorizationFilter
{
    private const string HeaderName = "X-Admin-Api-Key";

    public Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        if (context.HttpContext.User.Identity?.IsAuthenticated == true)
        {
            return Task.CompletedTask;
        }

        var settings = options.Value;
        if (settings.AllowApiKeyHeader &&
            !string.IsNullOrWhiteSpace(settings.ApiKey) &&
            context.HttpContext.Request.Headers.TryGetValue(HeaderName, out var providedKey) &&
            string.Equals(providedKey.ToString(), settings.ApiKey, StringComparison.Ordinal))
        {
            return Task.CompletedTask;
        }

        if (string.IsNullOrWhiteSpace(settings.Username) || string.IsNullOrWhiteSpace(settings.Password))
        {
            context.Result = new ObjectResult(new ApiError(
                "ADMIN_AUTH_NOT_CONFIGURED",
                environment.IsDevelopment()
                    ? "Configureer Admin:Username en Admin:Password voor admin-toegang."
                    : "Admin-toegang is niet geconfigureerd."))
            {
                StatusCode = StatusCodes.Status503ServiceUnavailable
            };
            return Task.CompletedTask;
        }

        context.Result = new ObjectResult(new ApiError("UNAUTHORIZED", "Geen geldige admin-sessie."))
        {
            StatusCode = StatusCodes.Status401Unauthorized
        };

        return Task.CompletedTask;
    }
}
