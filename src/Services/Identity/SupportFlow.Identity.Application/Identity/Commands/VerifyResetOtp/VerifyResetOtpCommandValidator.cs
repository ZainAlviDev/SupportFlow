using FluentValidation;

namespace SupportFlow.Identity.Application.Identity.Commands.VerifyResetOtp;

public sealed class VerifyResetOtpCommandValidator : AbstractValidator<VerifyResetOtpCommand>
{
    public VerifyResetOtpCommandValidator()
    {
        RuleFor(x => x.Channel)
            .NotEmpty()
            .Must(c => c is "email" or "whatsapp")
            .WithMessage("Channel must be email or whatsapp.");

        RuleFor(x => x.Code)
            .NotEmpty()
            .Length(6)
            .Matches("^[0-9]{6}$")
            .WithMessage("Enter the 6-digit code.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Enter a valid email address.");
    }
}
