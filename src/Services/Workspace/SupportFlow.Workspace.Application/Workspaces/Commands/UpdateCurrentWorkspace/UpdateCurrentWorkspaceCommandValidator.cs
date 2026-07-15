using FluentValidation;

namespace SupportFlow.Workspace.Application.Workspaces.Commands.UpdateCurrentWorkspace;

public sealed class UpdateCurrentWorkspaceCommandValidator : AbstractValidator<UpdateCurrentWorkspaceCommand>
{
    public UpdateCurrentWorkspaceCommandValidator()
    {
        RuleFor(x => x)
            .Must(x =>
                !string.IsNullOrWhiteSpace(x.Name)
                || !string.IsNullOrWhiteSpace(x.Timezone)
                || x.SettingsJson is not null)
            .WithMessage("Provide at least one of name, timezone, or settingsJson.");

        RuleFor(x => x.Name)
            .MinimumLength(2)
            .MaximumLength(200)
            .When(x => !string.IsNullOrWhiteSpace(x.Name));

        RuleFor(x => x.Timezone)
            .MinimumLength(2)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Timezone));
    }
}
