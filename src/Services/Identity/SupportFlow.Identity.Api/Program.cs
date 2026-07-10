using SupportFlow.Identity.Api.Middleware;
using SupportFlow.Identity.Application;
using SupportFlow.Identity.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.MapHealthChecks("/health/live");
app.MapControllers();

app.Run();
