namespace SupportFlow.Identity.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "supportflow.app";
    public string Audience { get; set; } = "supportflow.app";
    public int AccessTokenExpiryMinutes { get; set; } = 1;
    public int RefreshTokenExpiryDays { get; set; } = 7;
}
