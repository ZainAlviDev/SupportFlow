using FluentValidation;

namespace SupportFlow.Identity.Application.Identity.Commands.InviteMember;

public sealed class InviteMemberCommandValidator : AbstractValidator<InviteMemberCommand>
{
    public InviteMemberCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(role =>
                string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
                || string.Equals(role, "Agent", StringComparison.OrdinalIgnoreCase)
                || string.Equals(role, "Viewer", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Role must be Admin, Agent, or Viewer.");
    }
}
