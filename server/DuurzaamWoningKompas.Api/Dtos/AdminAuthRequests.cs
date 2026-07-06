namespace DuurzaamWoningKompas.Api.Dtos;

public sealed record AdminLoginRequest(string? Username, string? Password);

public sealed record AdminSessionResponse(bool Authenticated, string? Username);
