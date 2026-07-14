namespace SupportFlow.Identity.Infrastructure.Messaging;

public interface IWhatsAppOtpSender
{
    Task SendAsync(string phoneE164, string otp, CancellationToken cancellationToken);
}
