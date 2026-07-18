using FluentValidation;

namespace SupportFlow.Workspace.Application.ApiKeys.Commands.CreateApiKey;

public sealed class CreateApiKeyCommandValidator : AbstractValidator<CreateApiKeyCommand>
{
    public CreateApiKeyCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleForEach(x => x.AllowedDomains!).MaximumLength(253).When(x => x.AllowedDomains is not null);
    }
}
