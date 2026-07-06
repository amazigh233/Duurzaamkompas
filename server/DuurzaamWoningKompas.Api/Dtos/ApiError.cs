namespace DuurzaamWoningKompas.Api.Dtos;

public sealed record ApiError(
    string Code,
    string Message,
    IDictionary<string, string[]>? Errors = null);
