using Microsoft.Extensions.Logging;

namespace SupportFlow.Identity.Infrastructure.Messaging;

public sealed class ConsoleWhatsAppOtpSender : IWhatsAppOtpSender
{
    private readonly ILogger<ConsoleWhatsAppOtpSender> _logger;

    public ConsoleWhatsAppOtpSender(ILogger<ConsoleWhatsAppOtpSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string phoneE164, string otp, CancellationToken cancellationToken)
    {
        _logger.LogWarning("DEV WHATSAPP OTP to {Phone}: {Otp}", phoneE164, otp);
        return Task.CompletedTask;
    }
}
