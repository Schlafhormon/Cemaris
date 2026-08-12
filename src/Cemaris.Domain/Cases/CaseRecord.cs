namespace Cemaris.Domain.Cases;

/// <summary>
/// Minimal, persistence-independent root for synthetic Development case records.
/// It stores facts only and deliberately contains no status, term, fee or grave-type rules.
/// </summary>
public sealed record CaseRecord
{
    private CaseRecord(Guid id, CaseVersion version, GraveReference grave)
    {
        Id = id;
        Version = version;
        Grave = grave;
    }

    public Guid Id { get; }

    public CaseVersion Version { get; }

    public bool IsSynthetic { get; } = true;

    public GraveReference Grave { get; }

    public static CaseRecord CreateSynthetic(Guid id, GraveReference grave)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Die Fall-ID darf nicht leer sein.", nameof(id));
        }

        ArgumentNullException.ThrowIfNull(grave);
        return new CaseRecord(id, new CaseVersion(CaseVersion.InitialValue), grave);
    }
}
