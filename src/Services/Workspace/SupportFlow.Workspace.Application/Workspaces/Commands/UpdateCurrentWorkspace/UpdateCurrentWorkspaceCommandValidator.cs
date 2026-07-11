using FluentValidation;

namespace SupportFlow.Workspace.Application.Workspaces.Commands.UpdateCurrentWorkspace;

public sealed class UpdateCurrentWorkspaceCommandValidator : AbstractValidator<UpdateCurrentWorkspaceCommand>
{
    public UpdateCurrentWorkspaceCommandValidator()
    {
        RuleFor(x => x.Name)
            .MinimumLength(2)
            .MaximumLength(200)
            .When(x => !string.IsNullOrWhiteSpace(x.Name));

        RuleFor(x => x.Timezone)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Timezone));
    }
}
