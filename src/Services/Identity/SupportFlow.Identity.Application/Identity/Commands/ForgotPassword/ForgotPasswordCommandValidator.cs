using FluentValidation;

namespace SupportFlow.Identity.Application.Identity.Commands.ForgotPassword;

public sealed class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Channel)
            .NotEmpty()
            .Must(c => c is "email" or "whatsapp")
            .WithMessage("Channel must be email or whatsapp.");

        // Account is always looked up by registration email; OTP goes to stored email or WhatsApp.
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Enter a valid email address.");
    }
}
