using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SupportFlow.Knowledge.Infrastructure.Persistence;

public sealed class KnowledgeDbContextFactory : IDesignTimeDbContextFactory<KnowledgeDbContext>
{
    public KnowledgeDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<KnowledgeDbContext>()
            .UseSqlServer(
                "Server=.\\SQLEXPRESS;Database=SupportFlowKnowledgeDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=True",
                sqlServer => sqlServer.UseVectorSearch())
            .Options;

        return new KnowledgeDbContext(options);
    }
}
