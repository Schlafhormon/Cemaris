namespace Cemaris.Api.Contracts;

public sealed record SystemInformationResponse(
    string Name,
    string Subtitle,
    string Status,
    bool ProductionReady,
    string Version);
