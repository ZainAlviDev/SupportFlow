using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace SupportFlow.Workspace.Infrastructure.Persistence;

public class WorkspaceDbContextFactory : IDesignTimeDbContextFactory<WorkspaceDbContext>
{
    public WorkspaceDbContext CreateDbContext(string[] args)
    {
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "SupportFlow.Workspace.Api");

        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

        var optionsBuilder = new DbContextOptionsBuilder<WorkspaceDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new WorkspaceDbContext(optionsBuilder.Options);
    }
}
