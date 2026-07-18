namespace SupportFlow.AI.Infrastructure.AI;

public sealed class AzureOpenAiOptions
{
    public const string SectionName = "AzureOpenAI";

    public string Endpoint { get; init; } = string.Empty;
    public string ApiKey { get; init; } = string.Empty;
    public string ChatDeployment { get; init; } = "gpt-4o-mini";
    public string ApiVersion { get; init; } = "2024-10-21";
    public bool UseDevelopmentFallback { get; init; } = true;
}
