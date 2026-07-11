using FluentValidation;

namespace SupportFlow.Workspace.Application.Workspaces.Commands.CreateWorkspace;

public sealed class CreateWorkspaceCommandValidator : AbstractValidator<CreateWorkspaceCommand>
{
    public CreateWorkspaceCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Workspace name is required.")
            .MinimumLength(2).WithMessage("Workspace name must be at least 2 characters.")
            .MaximumLength(200).WithMessage("Workspace name must be at most 200 characters.");

        RuleFor(x => x.Timezone)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Timezone));

        RuleFor(x => x.Slug)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Slug));
    }
}
