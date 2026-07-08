using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DuurzaamWoningKompas.Api.Dtos;
using DuurzaamWoningKompas.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace DuurzaamWoningKompas.Api.Controllers;

[ApiController]
[Route("api/admin/session")]
public sealed class AdminSessionController(
    IOptions<AdminAuthOptions> options,
    IHostEnvironment environment) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(AdminSessionResponse), StatusCodes.Status200OK)]
    public ActionResult<AdminSessionResponse> GetSession()
    {
        return Ok(new AdminSessionResponse(
            User.Identity?.IsAuthenticated == true,
            User.Identity?.IsAuthenticated == true ? User.Identity.Name : null));
    }

    [HttpPost]
    [EnableRateLimiting("AdminLogin")]
    [ProducesResponseType(typeof(AdminSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<AdminSessionResponse>> Login(AdminLoginRequest request)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.Username) ||
            (string.IsNullOrWhiteSpace(settings.PasswordHash) &&
                (!environment.IsDevelopment() || string.IsNullOrWhiteSpace(settings.Password))))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new ApiError(
                "ADMIN_AUTH_NOT_CONFIGURED",
                "Admin-toegang is niet geconfigureerd."));
        }

        if (!SecureEquals(request.Username, settings.Username) || !PasswordMatches(request.Password, settings))
        {
            return Unauthorized(new ApiError("UNAUTHORIZED", "Geen geldige admin-inloggegevens."));
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, settings.Username),
            new Claim(ClaimTypes.Role, "Admin")
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties
            {
                IsPersistent = false,
                IssuedUtc = DateTimeOffset.UtcNow
            });

        return Ok(new AdminSessionResponse(true, settings.Username));
    }

    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    private static bool SecureEquals(string? provided, string expected)
    {
        if (provided is null)
        {
            return false;
        }

        var providedBytes = Encoding.UTF8.GetBytes(provided);
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        return providedBytes.Length == expectedBytes.Length &&
            CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
    }

    private bool PasswordMatches(string? providedPassword, AdminAuthOptions settings)
    {
        if (string.IsNullOrWhiteSpace(providedPassword))
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(settings.PasswordHash))
        {
            return AdminPasswordVerifier.Verify(providedPassword, settings.PasswordHash);
        }

        return environment.IsDevelopment() &&
            !string.IsNullOrWhiteSpace(settings.Password) &&
            SecureEquals(providedPassword, settings.Password);
    }
}
