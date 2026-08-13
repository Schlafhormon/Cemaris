namespace Cemaris.Application.Identity;

/// <summary>
/// Fixed server-side actor for the explicitly enabled synthetic Development write path.
/// It is not an authentication mechanism and accepts no request-provided identity.
/// </summary>
public sealed class SyntheticDevelopmentActorProvider : ICurrentActorProvider
{
    public const string ActorId = "synthetic-development-case-worker";

    public const string ActorDisplayName = "Synthetische Development-Sachbearbeitung";

    public static ActorIdentity Actor { get; } = new(
        ActorId,
        ActorDisplayName,
        SystemRole.Sachbearbeitung);

    public ActorIdentity Current => Actor;
}
