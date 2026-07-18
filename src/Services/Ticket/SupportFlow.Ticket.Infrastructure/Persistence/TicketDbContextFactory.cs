using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using SupportFlow.Ticket.Infrastructure.Persistence;

namespace SupportFlow.Ticket.Infrastructure.Persistence;

public sealed class TicketDbContextFactory : IDesignTimeDbContextFactory<TicketDbContext>
{
    public TicketDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<TicketDbContext>()
            .UseSqlServer(
                "Server=.\\SQLEXPRESS;Database=SupportFlowTicketDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=True")
            .Options;

        return new TicketDbContext(options);
    }
}
