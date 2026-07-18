using SupportFlow.Gateway.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();
builder.Services.AddSingleton<GatewayHealthService>();
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    // Reflect request origin so dashboard cookies and widget embeds both work.
    options.AddPolicy("Dashboard", policy =>
        policy.SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});
builder.Services.AddReverseProxy().LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseWebSockets();
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
