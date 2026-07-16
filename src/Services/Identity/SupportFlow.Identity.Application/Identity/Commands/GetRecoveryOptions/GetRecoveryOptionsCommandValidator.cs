using FluentValidation;

namespace SupportFlow.Identity.Application.Identity.Commands.GetRecoveryOptions;

public sealed class GetRecoveryOptionsCommandValidator : AbstractValidator<GetRecoveryOptionsCommand>
{
    public GetRecoveryOptionsCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}
