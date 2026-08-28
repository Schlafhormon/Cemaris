namespace Cemaris.Api.Contracts;

public sealed record SystemInformationResponse(
    string Name,
    string Subtitle,
    string Status,
    bool ProductionReady,
    bool CaseEditingEnabled,
    bool CemeteryMasterDataEditingEnabled,
    bool BurialProcessEditingEnabled,
    bool PersonUsageRightsEditingEnabled,
    bool NoticeDraftEditingEnabled,
    bool NoticeGenerationEnabled,
    string Version);
