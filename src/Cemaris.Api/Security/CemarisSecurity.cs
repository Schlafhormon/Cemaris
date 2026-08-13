using System.Security.Claims;
using Cemaris.Application.Identity;

namespace Cemaris.Api.Security;

public static class CemarisPolicies
{
    public const string CaseWork = "CaseWork";
    public const string BurialProcess = "BurialProcess";
    public const string MasterData = "MasterData";
    public const string MasterDataDeletion = "MasterDataDeletion";
    public const string UserAdministration = "UserAdministration";
    public const string ProgramConfiguration = "ProgramConfiguration";
    public const string FormTemplates = "FormTemplates";

    public static IReadOnlyDictionary<string, IReadOnlyList<SystemRole>> Matrix { get; } =
        new Dictionary<string, IReadOnlyList<SystemRole>>(StringComparer.Ordinal)
        {
            [CaseWork] = SystemRole.All,
            [BurialProcess] = SystemRole.All,
            [MasterData] = SystemRole.All,
            [MasterDataDeletion] = [SystemRole.Administration],
            [UserAdministration] = [SystemRole.Administration],
            [ProgramConfiguration] = [SystemRole.Administration],
            [FormTemplates] = [SystemRole.Administration],
        };
}

public static class CemarisClaimTypes
{
    public const string SecurityStamp = "cemaris:security-stamp";
    public const string PasswordChangeRequired = "cemaris:password-change-required";
}

public sealed class HttpCurrentActorProvider(IHttpContextAccessor contextAccessor)
    : ICurrentActorProvider
{
    public ActorIdentity Current => ClaimsActorIdentityFactory.Create(
        contextAccessor.HttpContext?.User
        ?? throw new InvalidOperationException("Für die Änderung liegt kein HTTP-Kontext vor."));
}

public static class PrincipalAccount
{
    public static bool TryGetId(ClaimsPrincipal principal, out Guid id) =>
        Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out id) && id != Guid.Empty;
}
