using Cemaris.Application.Identity;

namespace Cemaris.Api.Security;

internal static partial class SecurityLog
{
    [LoggerMessage(EventId = 2001, Level = LogLevel.Information, Message = "Local login succeeded for account {AccountId}.")]
    internal static partial void LoginSucceeded(ILogger logger, Guid accountId);

    [LoggerMessage(EventId = 2002, Level = LogLevel.Warning, Message = "Local login failed with generic outcome.")]
    internal static partial void LoginFailed(ILogger logger);

    [LoggerMessage(EventId = 2003, Level = LogLevel.Information, Message = "Local account {AccountId} signed out.")]
    internal static partial void Logout(ILogger logger, Guid accountId);

    [LoggerMessage(EventId = 2004, Level = LogLevel.Information, Message = "Local account {AccountId} changed its password.")]
    internal static partial void PasswordChanged(ILogger logger, Guid accountId);

    [LoggerMessage(EventId = 2010, Level = LogLevel.Information, Message = "Administrative account operation {Operation} by {ActorId} for {TargetAccountId} completed with {Outcome}.")]
    internal static partial void AdministrationOperation(
        ILogger logger,
        Guid actorId,
        Guid targetAccountId,
        string operation,
        LocalAccountOperationStatus outcome);

    [LoggerMessage(EventId = 2020, Level = LogLevel.Information, Message = "First local administrator {AccountId} was bootstrapped.")]
    internal static partial void BootstrapCompleted(ILogger logger, Guid accountId);
}
