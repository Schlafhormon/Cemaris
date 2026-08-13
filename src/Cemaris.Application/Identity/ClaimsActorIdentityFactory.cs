using System.Security.Claims;

namespace Cemaris.Application.Identity;

public static class ClaimsActorIdentityFactory
{
    public static ActorIdentity Create(ClaimsPrincipal principal)
    {
        ArgumentNullException.ThrowIfNull(principal);
        var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        var displayName = principal.FindFirstValue(ClaimTypes.Name);
        var roles = principal.FindAll(ClaimTypes.Role).Select(item => item.Value).ToArray();

        if (!Guid.TryParse(idValue, out var id) || id == Guid.Empty
            || string.IsNullOrWhiteSpace(displayName)
            || roles.Length != 1)
        {
            throw new InvalidOperationException("Die authentifizierte Akteursidentität ist unvollständig oder ungültig.");
        }

        return new ActorIdentity(id.ToString("D"), displayName, SystemRole.Parse(roles[0]));
    }
}
