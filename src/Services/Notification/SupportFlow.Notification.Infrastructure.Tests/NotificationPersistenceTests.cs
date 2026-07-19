using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SupportFlow.Notification.Infrastructure.Hubs;
using SupportFlow.Notification.Infrastructure.Notifications;
using SupportFlow.Notification.Infrastructure.Persistence;
using SupportFlow.Shared.Contracts.Notifications;
using SupportFlow.Shared.Kernel.Tenancy;
using Xunit;

namespace SupportFlow.Notification.Infrastructure.Tests;

[Collection("NotificationSql")]
public sealed class NotificationPersistenceTests : IAsyncLifetime
{
    private static readonly string ConnectionString =
        $"Server=.\\SQLEXPRESS;Database=SupportFlowNotificationTestDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=True";

    private readonly string _testPrefix = $"n-{Guid.NewGuid():N}";

    public async Task InitializeAsync()
    {
        await using var context = CreateContext(Guid.NewGuid());
        await context.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await using var context = CreateContext(Guid.NewGuid());
        var rows = await context.Notifications
            .IgnoreQueryFilters()
            .Where(x => x.Title.StartsWith(_testPrefix))
            .ToListAsync();
        context.Notifications.RemoveRange(rows);
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task QueryFilters_IsolateTenants()
    {
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();
        var userId = Guid.NewGuid();

        await using (var writeA = CreateContext(tenantA))
        {
            var serviceA = new NotificationService(writeA, new NullNotificationHubContext());
            var created = await serviceA.CreateAsync(tenantA, NewRequest(userId, "for-a"), CancellationToken.None);
            Assert.NotEqual(Guid.Empty, created.Id);
        }

        await using (var writeB = CreateContext(tenantB))
        {
            var serviceB = new NotificationService(writeB, new NullNotificationHubContext());
            await serviceB.CreateAsync(tenantB, NewRequest(userId, "for-b"), CancellationToken.None);
        }

        await using var readA = CreateContext(tenantA);
        var service = new NotificationService(readA, new NullNotificationHubContext());
        var listed = await service.ListAsync(tenantA, userId, 1, 20, null, CancellationToken.None);

        Assert.All(listed.Items, item => Assert.Equal(tenantA, item.TenantId));
        Assert.Contains(listed.Items, item => item.Title.Contains("for-a", StringComparison.Ordinal));
        Assert.DoesNotContain(listed.Items, item => item.Title.Contains("for-b", StringComparison.Ordinal));
    }

    [Fact]
    public async Task List_IsScopedToCurrentUser()
    {
        var tenantId = Guid.NewGuid();
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        await using (var write = CreateContext(tenantId))
        {
            var service = new NotificationService(write, new NullNotificationHubContext());
            await service.CreateAsync(tenantId, NewRequest(userA, "user-a"), CancellationToken.None);
            await service.CreateAsync(tenantId, NewRequest(userB, "user-b"), CancellationToken.None);
        }

        await using var read = CreateContext(tenantId);
        var listed = await new NotificationService(read, new NullNotificationHubContext())
            .ListAsync(tenantId, userA, 1, 20, null, CancellationToken.None);

        Assert.All(listed.Items, item => Assert.Equal(userA, item.UserId));
        Assert.DoesNotContain(listed.Items, item => item.Title.Contains("user-b", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Create_IsIdempotent_ByKey()
    {
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var title = $"{_testPrefix}-idem";
        var request = new CreateNotificationRequest(
            userId,
            "NewMessage",
            title,
            "Body",
            "conversation",
            Guid.NewGuid(),
            $"key-{Guid.NewGuid():N}");

        Guid firstId;
        await using (var write = CreateContext(tenantId))
        {
            var service = new NotificationService(write, new NullNotificationHubContext());
            var first = await service.CreateAsync(tenantId, request, CancellationToken.None);
            var second = await service.CreateAsync(tenantId, request, CancellationToken.None);
            Assert.Equal(first.Id, second.Id);
            firstId = first.Id;
        }

        await using var read = CreateContext(tenantId);
        var listed = await new NotificationService(read, new NullNotificationHubContext())
            .ListAsync(tenantId, userId, 1, 50, null, CancellationToken.None);
        Assert.Equal(1, listed.Items.Count(x => x.Title == title));
        Assert.Contains(listed.Items, x => x.Id == firstId);
    }

    [Fact]
    public async Task MarkAsRead_UpdatesUnreadCount()
    {
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        Guid createdId;

        await using (var write = CreateContext(tenantId))
        {
            var service = new NotificationService(write, new NullNotificationHubContext());
            var created = await service.CreateAsync(tenantId, NewRequest(userId, "read-me"), CancellationToken.None);
            createdId = created.Id;
        }

        await using var context = CreateContext(tenantId);
        var readService = new NotificationService(context, new NullNotificationHubContext());
        var unreadBefore = await readService.GetUnreadCountAsync(tenantId, userId, CancellationToken.None);
        Assert.True(unreadBefore.Count >= 1);

        await readService.MarkAsReadAsync(tenantId, userId, createdId, CancellationToken.None);
        var unreadAfter = await readService.GetUnreadCountAsync(tenantId, userId, CancellationToken.None);
        Assert.True(unreadAfter.Count < unreadBefore.Count);
    }

    [Fact]
    public async Task MarkAsRead_WrongUser_ThrowsNotFound()
    {
        var tenantId = Guid.NewGuid();
        var owner = Guid.NewGuid();
        var other = Guid.NewGuid();
        Guid createdId;

        await using (var write = CreateContext(tenantId))
        {
            var created = await new NotificationService(write, new NullNotificationHubContext())
                .CreateAsync(tenantId, NewRequest(owner, "private"), CancellationToken.None);
            createdId = created.Id;
        }

        await using var context = CreateContext(tenantId);
        await Assert.ThrowsAsync<SupportFlow.Notification.Application.Common.Exceptions.NotFoundException>(() =>
            new NotificationService(context, new NullNotificationHubContext())
                .MarkAsReadAsync(tenantId, other, createdId, CancellationToken.None));
    }

    private CreateNotificationRequest NewRequest(Guid userId, string suffix) =>
        new(
            userId,
            "NewMessage",
            $"{_testPrefix}-{suffix}",
            "Body",
            "conversation",
            Guid.NewGuid());

    private static NotificationDbContext CreateContext(Guid tenantId)
    {
        var tenantContext = new TenantContext();
        tenantContext.SetTenant(tenantId);
        var options = new DbContextOptionsBuilder<NotificationDbContext>()
            .UseSqlServer(ConnectionString)
            .Options;
        return new NotificationDbContext(options, tenantContext);
    }

    private sealed class NullNotificationHubContext : IHubContext<NotificationHub>
    {
        public IHubClients Clients { get; } = new NullHubClients();
        public IGroupManager Groups { get; } = new NullGroupManager();
    }

    private sealed class NullHubClients : IHubClients
    {
        public IClientProxy All => new NullClientProxy();
        public IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => All;
        public IClientProxy Client(string connectionId) => All;
        public IClientProxy Clients(IReadOnlyList<string> connectionIds) => All;
        public IClientProxy Group(string groupName) => All;
        public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => All;
        public IClientProxy Groups(IReadOnlyList<string> groupNames) => All;
        public IClientProxy User(string userId) => All;
        public IClientProxy Users(IReadOnlyList<string> userIds) => All;
    }

    private sealed class NullGroupManager : IGroupManager
    {
        public Task AddToGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task RemoveFromGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class NullClientProxy : IClientProxy
    {
        public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }
}
