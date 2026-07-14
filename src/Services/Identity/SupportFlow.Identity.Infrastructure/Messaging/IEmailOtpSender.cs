namespace SupportFlow.Identity.Infrastructure.Messaging;

public interface IEmailOtpSender
{
    Task SendAsync(string email, string otp, CancellationToken cancellationToken, string purpose = "recovery");
}
