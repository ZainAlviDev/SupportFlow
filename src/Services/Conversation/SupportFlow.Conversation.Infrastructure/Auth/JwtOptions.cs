namespace SupportFlow.Conversation.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "supportflow.app";
    public string Audience { get; set; } = "supportflow.app";
}
