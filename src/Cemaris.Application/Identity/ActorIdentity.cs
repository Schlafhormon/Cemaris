namespace Cemaris.Application.Identity;

public sealed record ActorIdentity
{
    public ActorIdentity(string id, string displayName, SystemRole role)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new ArgumentException("Die technische Akteurskennung darf nicht leer sein.", nameof(id));
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new ArgumentException("Der darstellbare Akteursname darf nicht leer sein.", nameof(displayName));
        }

        Id = id.Trim();
        DisplayName = displayName.Trim();
        Role = role ?? throw new ArgumentNullException(nameof(role));
    }

    public string Id { get; }

    public string DisplayName { get; }

    public SystemRole Role { get; }
}

public sealed record SystemRole
{
    public static SystemRole Sachbearbeitung { get; } = new("Sachbearbeitung");

    public static SystemRole Administration { get; } = new("Administration");

    public static IReadOnlyList<SystemRole> All { get; } =
        [Sachbearbeitung, Administration];

    private SystemRole(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static SystemRole Parse(string value) => value switch
    {
        "Sachbearbeitung" => Sachbearbeitung,
        "Administration" => Administration,
        _ => throw new ArgumentOutOfRangeException(
            nameof(value),
            value,
            "Unbekannte Systemrolle."),
    };

    public override string ToString() => Value;
}

public interface ICurrentActorProvider
{
    ActorIdentity Current { get; }
}
