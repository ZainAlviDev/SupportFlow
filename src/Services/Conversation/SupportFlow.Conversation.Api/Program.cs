using SupportFlow.Conversation.Api.Middleware;
using SupportFlow.Conversation.Application;
using SupportFlow.Conversation.Infrastructure;
using SupportFlow.Conversation.Infrastructure.Hubs;
using SupportFlow.Shared.Infrastructure.Tenancy;

var builder = WebApplication.CreateBuilder(args);

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000", "http://127.0.0.1:3000"];

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Dashboard", policy =>
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("Dashboard");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<TenantResolutionMiddleware>();

app.MapHealthChecks("/health/live");
app.MapControllers();
app.MapHub<ConversationHub>("/hubs/conversation");
app.MapHub<PresenceHub>("/hubs/presence");

app.Run();
