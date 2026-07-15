using Microsoft.EntityFrameworkCore;
using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Shared.Kernel.Enums;
using SupportFlow.Workspace.Application.Common.Exceptions;
using SupportFlow.Workspace.Application.Common.Interfaces;
using SupportFlow.Workspace.Domain.Common;
using SupportFlow.Workspace.Domain.Entities;
using SupportFlow.Workspace.Infrastructure.Persistence;

namespace SupportFlow.Workspace.Infrastructure.Workspaces;

public sealed class WorkspaceService : IWorkspaceService
{
    private readonly WorkspaceDbContext _dbContext;

    public WorkspaceService(WorkspaceDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<WorkspaceDto> CreateAsync(
        Guid tenantId,
        string name,
        string? slug,
        string? timezone,
        CancellationToken cancellationToken)
    {
        var existing = await _dbContext.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == tenantId && !w.IsDeleted, cancellationToken);

        if (existing is not null)
        {
            throw new ConflictException("Workspace already exists for this account.");
        }

        var resolvedSlug = await CreateUniqueSlugAsync(
            string.IsNullOrWhiteSpace(slug) ? name : slug,
            cancellationToken);

        var workspace = new WorkspaceProfile(
            tenantId,
            name.Trim(),
            resolvedSlug,
            string.IsNullOrWhiteSpace(timezone) ? "UTC" : timezone.Trim());

        _dbContext.Workspaces.Add(workspace);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Map(workspace);
    }

    public async Task<WorkspaceDto> GetCurrentAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var workspace = await EnsureProfileAsync(tenantId, preferredName: null, preferredTimezone: null, cancellationToken);
        return Map(workspace);
    }

    public async Task<WorkspaceDto> UpdateCurrentAsync(
        Guid tenantId,
        string? name,
        string? timezone,
        string? settingsJson,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name)
            && string.IsNullOrWhiteSpace(timezone)
            && settingsJson is null)
        {
            throw new ConflictException("Provide a workspace name and/or timezone to update.");
        }

        var workspace = await EnsureProfileAsync(tenantId, name, timezone, cancellationToken);
        workspace.Update(name, timezone, settingsJson);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Map(workspace);
    }

    private async Task<WorkspaceProfile> EnsureProfileAsync(
        Guid tenantId,
        string? preferredName,
        string? preferredTimezone,
        CancellationToken cancellationToken)
    {
        var workspace = await _dbContext.Workspaces
            .FirstOrDefaultAsync(
                w => w.Id == tenantId && !w.IsDeleted && w.Status == EntityStatus.Active,
                cancellationToken);

        if (workspace is not null)
        {
            return workspace;
        }

        var seedName = string.IsNullOrWhiteSpace(preferredName) ? "My Workspace" : preferredName.Trim();
        var seedTimezone = string.IsNullOrWhiteSpace(preferredTimezone) ? "UTC" : preferredTimezone.Trim();
        var slug = await CreateUniqueSlugAsync(seedName, cancellationToken);

        workspace = new WorkspaceProfile(tenantId, seedName, slug, seedTimezone);
        _dbContext.Workspaces.Add(workspace);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return workspace;
    }

    private async Task<string> CreateUniqueSlugAsync(string source, CancellationToken cancellationToken)
    {
        var baseSlug = SlugGenerator.FromName(source);
        var slug = baseSlug;
        var attempt = 1;

        // Slug uniqueness is global (unique index); bypass tenant Id + soft-delete filters.
        while (await _dbContext.Workspaces
                   .IgnoreQueryFilters()
                   .AnyAsync(w => w.Slug == slug, cancellationToken))
        {
            attempt++;
            slug = $"{baseSlug}-{attempt}";
        }

        return slug;
    }

    private static WorkspaceDto Map(WorkspaceProfile workspace) =>
        new(
            workspace.Id,
            workspace.Name,
            workspace.Slug,
            workspace.Timezone,
            workspace.Plan,
            workspace.SettingsJson,
            workspace.CreatedAt);
}
