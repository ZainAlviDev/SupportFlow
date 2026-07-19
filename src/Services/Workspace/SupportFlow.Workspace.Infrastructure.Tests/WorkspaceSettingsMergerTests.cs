using SupportFlow.Shared.Contracts.Workspaces;
using SupportFlow.Workspace.Application.Common.Exceptions;
using SupportFlow.Workspace.Infrastructure.Workspaces;
using Xunit;

namespace SupportFlow.Workspace.Infrastructure.Tests;

public sealed class WorkspaceSettingsMergerTests
{
    [Fact]
    public void Merge_PreservesUnrelatedSections()
    {
        var existing = """{"widget":{"primaryColor":"#111111","position":"bottom-right","welcomeMessage":"Hello"},"custom":{"flag":true}}""";

        var merged = WorkspaceSettingsMerger.Merge(
            existing,
            rawSettingsJson: null,
            widget: null,
            businessHours: new BusinessHoursSettingsDto(
                Enabled: true,
                Timezone: "UTC",
                Days:
                [
                    new BusinessHoursDayDto("Monday", true, "09:00", "17:00"),
                    new BusinessHoursDayDto("Tuesday", false),
                    new BusinessHoursDayDto("Wednesday", false),
                    new BusinessHoursDayDto("Thursday", false),
                    new BusinessHoursDayDto("Friday", false),
                    new BusinessHoursDayDto("Saturday", false),
                    new BusinessHoursDayDto("Sunday", false),
                ],
                OfflineMessage: "Closed"));

        Assert.Contains("\"custom\"", merged, StringComparison.Ordinal);
        Assert.Contains("\"businessHours\"", merged, StringComparison.Ordinal);
        Assert.Contains("#111111", merged, StringComparison.Ordinal);
    }

    [Fact]
    public void Merge_RejectsInvalidColor()
    {
        Assert.Throws<ConflictException>(() =>
            WorkspaceSettingsMerger.Merge(
                existingJson: null,
                rawSettingsJson: null,
                widget: new WidgetSettingsDto(PrimaryColor: "green"),
                businessHours: null));
    }

    [Fact]
    public void Parse_ReturnsDefaults_WhenMissing()
    {
        var (widget, hours) = WorkspaceSettingsMerger.Parse(null);
        Assert.Equal("#10b981", widget.PrimaryColor);
        Assert.Equal("bottom-right", widget.Position);
        Assert.Null(hours);
    }
}
