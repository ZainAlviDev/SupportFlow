namespace SupportFlow.Identity.Infrastructure.Options;

public sealed class OtpOptions
{
    public const string SectionName = "Otp";

    public int Length { get; set; } = 6;
    public int ExpiryMinutes { get; set; } = 2;
    public int MaxAttempts { get; set; } = 5;
    public int ResetTokenExpiryMinutes { get; set; } = 15;
}
