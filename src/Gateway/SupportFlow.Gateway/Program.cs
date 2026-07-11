using SupportFlow.Gateway.Services;

var builder = WebApplication.CreateBuilder(args);

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];

builder.Services.AddHttpClient();
builder.Services.AddSingleton<GatewayHealthService>();
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Dashboard", policy =>
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});
builder.Services.AddReverseProxy().LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseCors("Dashboard");

app.MapGet("/health", async (GatewayHealthService healthService, CancellationToken ct) =>
{
    var report = await healthService.CheckAllServicesAsync(ct);
    return report.AllHealthy ? Results.Ok(report) : Results.Json(report, statusCode: 503);
});

app.MapGet("/", () => Results.Ok(new
{
    name = "SupportFlow API Gateway",
    version = "1.0.0",
    docs = "/health"
}));

app.MapControllers();
app.MapReverseProxy();

app.Run();
