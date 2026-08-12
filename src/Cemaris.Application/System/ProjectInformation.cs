namespace Cemaris.Application.System;

/// <summary>
/// Provides the public, non-sensitive status shown by the API and user interface.
/// </summary>
public sealed record ProjectInformation(
    string Name,
    string Subtitle,
    string Phase,
    bool ProductionReady)
{
    public static ProjectInformation Current { get; } = new(
        "Cemaris",
        "Open-Source-Friedhofsverwaltung für Kommunen",
        "Inkrementelle Produktentwicklung",
        ProductionReady: false);
}
