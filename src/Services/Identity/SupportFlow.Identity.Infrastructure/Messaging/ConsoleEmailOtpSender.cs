using Microsoft.Extensions.Logging;

namespace SupportFlow.Identity.Infrastructure.Messaging;

public sealed class ConsoleEmailOtpSender : IEmailOtpSender
{
    private readonly ILogger<ConsoleEmailOtpSender> _logger;

    public ConsoleEmailOtpSender(ILogger<ConsoleEmailOtpSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(
        string email,
        string otp,
        CancellationToken cancellationToken,
        string purpose = "recovery")
    {
        _logger.LogWarning("DEV EMAIL OTP ({Purpose}) to {Email}: {Otp}", purpose, email, otp);
        return Task.CompletedTask;
    }
}
