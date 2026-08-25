using System.Data;
using Cemaris.Application.Cemeteries;
using Cemaris.Application.Identity;
using Cemaris.Infrastructure.Cemeteries;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.Cemeteries;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.EdWaltMigration;

public sealed class SqlCemeteryImporter
{
    public const string ExpectedDatabase = "Cemaris_Dev";
    private const string IntegrationTestDatabasePrefix = "Cemaris_IntegrationTests_";
    private const string MigrationActorId = "cemaris-edwalt-master-data-migration";
    private const string MigrationActorName = "EDWALT-Stammdatenmigration";
    private readonly CemarisDbContext dbContext;
    private readonly TimeProvider timeProvider;
    private readonly string authorizedDatabase;

    public SqlCemeteryImporter(CemarisDbContext dbContext, TimeProvider timeProvider)
        : this(dbContext, timeProvider, ExpectedDatabase)
    {
    }

    internal SqlCemeteryImporter(
        CemarisDbContext dbContext,
        TimeProvider timeProvider,
        string authorizedDatabase)
    {
        if (!string.Equals(authorizedDatabase, ExpectedDatabase, StringComparison.Ordinal) &&
            !(authorizedDatabase.StartsWith(IntegrationTestDatabasePrefix, StringComparison.Ordinal) &&
              authorizedDatabase.Length > IntegrationTestDatabasePrefix.Length))
        {
            throw new InvalidOperationException("Der autorisierte Datenbankname ist unzulässig.");
        }

        this.dbContext = dbContext;
        this.timeProvider = timeProvider;
        this.authorizedDatabase = authorizedDatabase;
    }

    public async Task<ApplyReport> ApplyAsync(
        CemeteryMigrationPlan plan,
        SafeMigrationReport dryRun,
        string? environmentName,
        string? configuredProvider,
        string? configuredExpectedDatabase,
        string confirmation,
        CancellationToken cancellationToken)
    {
        if (!plan.IsSuccessful ||
            !string.Equals(dryRun.Status, "success", StringComparison.Ordinal) ||
            !string.Equals(dryRun.DatasetFingerprint, plan.DatasetFingerprint, StringComparison.Ordinal) ||
            !string.Equals(dryRun.PlanFingerprint, plan.PlanFingerprint, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Apply erfordert einen aktuellen erfolgreichen Dry-run.");
        }

        ValidateExecutionBoundary(environmentName, configuredProvider, configuredExpectedDatabase, confirmation);
        await ValidateDatabaseAsync(cancellationToken);
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var desiredEntityIds = plan.Cemeteries.Select(item => item.Id)
            .Concat(plan.GraveTypes.Select(item => item.Id))
            .Concat(plan.CemeteryGraveTypes.Select(item => item.Id))
            .ToArray();
        var audits = await dbContext.CemeteryMasterDataChanges
            .AsNoTracking()
            .Where(item => desiredEntityIds.Contains(item.EntityId) && item.ResultingVersion == 1)
            .ToArrayAsync(cancellationToken);

        var cemeteryState = await InspectCemeteriesAsync(plan.Cemeteries, audits, cancellationToken);
        var graveTypeState = await InspectGraveTypesAsync(plan.GraveTypes, audits, cancellationToken);
        var assignmentState = await InspectAssignmentsAsync(plan.CemeteryGraveTypes, audits, cancellationToken);
        var conflicts = cemeteryState.Conflicts + graveTypeState.Conflicts + assignmentState.Conflicts;
        if (conflicts > 0)
        {
            throw new InvalidOperationException(
                "Der Import wurde wegen bestehender Zielkonflikte vollständig abgebrochen.");
        }

        var service = new CemeteryMasterDataService(
            new EfCemeteryMasterDataStore(dbContext),
            new MigrationActorProvider(),
            timeProvider);
        foreach (var desired in cemeteryState.Created)
        {
            EnsureSuccess(await service.SaveCemeteryAsync(
                desired.Id,
                null,
                new SaveCemeteryCommand(desired.Name, desired.Code, null, null, true),
                cancellationToken));
        }

        foreach (var desired in graveTypeState.Created)
        {
            EnsureSuccess(await service.SaveGraveTypeAsync(
                desired.Id,
                null,
                new SaveGraveTypeCommand(
                    desired.Name,
                    desired.Code,
                    desired.BurialForm,
                    null,
                    desired.IsActive),
                cancellationToken));
        }

        foreach (var desired in assignmentState.Created)
        {
            EnsureSuccess(await service.SaveCemeteryGraveTypeAsync(
                desired.Id,
                null,
                new SaveCemeteryGraveTypeCommand(
                    desired.CemeteryId,
                    desired.GraveTypeId,
                    desired.IsActive),
                cancellationToken));
        }

        await transaction.CommitAsync(cancellationToken);
        return new ApplyReport(
            1,
            "success",
            timeProvider.GetUtcNow(),
            plan.DatasetFingerprint,
            plan.PlanFingerprint,
            cemeteryState.Created.Count,
            cemeteryState.Preserved,
            graveTypeState.Created.Count,
            graveTypeState.Preserved,
            assignmentState.Created.Count,
            assignmentState.Preserved,
            0);
    }

    public async Task<ReconciliationReport> ReconcileAsync(
        CemeteryMigrationPlan plan,
        string? environmentName,
        string? configuredProvider,
        string? configuredExpectedDatabase,
        CancellationToken cancellationToken)
    {
        ValidateExecutionBoundary(environmentName, configuredProvider, configuredExpectedDatabase, authorizedDatabase);
        await ValidateDatabaseAsync(cancellationToken);
        var desiredEntityIds = plan.Cemeteries.Select(item => item.Id)
            .Concat(plan.GraveTypes.Select(item => item.Id))
            .Concat(plan.CemeteryGraveTypes.Select(item => item.Id))
            .ToArray();
        var audits = await dbContext.CemeteryMasterDataChanges
            .AsNoTracking()
            .Where(item => desiredEntityIds.Contains(item.EntityId) && item.ResultingVersion == 1)
            .ToArrayAsync(cancellationToken);
        var cemeteries = await ReconcileCemeteriesAsync(plan.Cemeteries, audits, cancellationToken);
        var graveTypes = await ReconcileGraveTypesAsync(plan.GraveTypes, audits, cancellationToken);
        var assignments = await ReconcileAssignmentsAsync(plan.CemeteryGraveTypes, audits, cancellationToken);
        var status = cemeteries.Missing + cemeteries.Conflicting +
                     graveTypes.Missing + graveTypes.Conflicting +
                     assignments.Missing + assignments.Conflicting == 0
            ? "success"
            : "failed";
        return new ReconciliationReport(
            1,
            status,
            timeProvider.GetUtcNow(),
            plan.DatasetFingerprint,
            plan.PlanFingerprint,
            plan.Cemeteries.Count,
            cemeteries.Matching,
            cemeteries.Missing,
            cemeteries.Conflicting,
            plan.GraveTypes.Count,
            graveTypes.Matching,
            graveTypes.Missing,
            graveTypes.Conflicting,
            plan.CemeteryGraveTypes.Count,
            assignments.Matching,
            assignments.Missing,
            assignments.Conflicting);
    }

    private async Task<ImportState<DesiredCemetery>> InspectCemeteriesAsync(
        IReadOnlyList<DesiredCemetery> desired,
        IReadOnlyList<CemeteryMasterDataChangeEntity> audits,
        CancellationToken cancellationToken)
    {
        var ids = desired.Select(item => item.Id).ToArray();
        var codes = desired.Select(item => item.NormalizedCode).ToArray();
        var names = desired.Select(item => item.NormalizedName).ToArray();
        var existing = await dbContext.Cemeteries.AsNoTracking()
            .Where(item => ids.Contains(item.Id) || codes.Contains(item.NormalizedCode!) || names.Contains(item.NormalizedName))
            .ToArrayAsync(cancellationToken);
        var created = new List<DesiredCemetery>();
        var preserved = 0;
        var conflicts = 0;
        foreach (var item in desired)
        {
            var sameId = existing.SingleOrDefault(entity => entity.Id == item.Id);
            var colliding = existing.Any(entity => entity.Id != item.Id &&
                (entity.NormalizedCode == item.NormalizedCode || entity.NormalizedName == item.NormalizedName));
            if (colliding)
            {
                conflicts++;
            }
            else if (sameId is null)
            {
                created.Add(item);
            }
            else if (CemeteryMatches(sameId, item) && HasCreationAudit(audits, "Cemetery", item.Id))
            {
                preserved++;
            }
            else
            {
                conflicts++;
            }
        }

        return new ImportState<DesiredCemetery>(created, preserved, conflicts);
    }

    private async Task<ImportState<DesiredGraveType>> InspectGraveTypesAsync(
        IReadOnlyList<DesiredGraveType> desired,
        IReadOnlyList<CemeteryMasterDataChangeEntity> audits,
        CancellationToken cancellationToken)
    {
        var ids = desired.Select(item => item.Id).ToArray();
        var codes = desired.Where(item => item.NormalizedCode is not null).Select(item => item.NormalizedCode!).ToArray();
        var names = desired.Select(item => item.NormalizedName).ToArray();
        var existing = await dbContext.GraveTypes.AsNoTracking()
            .Where(item => ids.Contains(item.Id) || names.Contains(item.NormalizedName) ||
                           item.NormalizedCode != null && codes.Contains(item.NormalizedCode))
            .ToArrayAsync(cancellationToken);
        var created = new List<DesiredGraveType>();
        var preserved = 0;
        var conflicts = 0;
        foreach (var item in desired)
        {
            var sameId = existing.SingleOrDefault(entity => entity.Id == item.Id);
            var colliding = existing.Any(entity => entity.Id != item.Id &&
                (entity.NormalizedName == item.NormalizedName ||
                 item.NormalizedCode is not null && entity.NormalizedCode == item.NormalizedCode));
            if (colliding)
            {
                conflicts++;
            }
            else if (sameId is null)
            {
                created.Add(item);
            }
            else if (GraveTypeMatches(sameId, item) && HasCreationAudit(audits, "GraveType", item.Id))
            {
                preserved++;
            }
            else
            {
                conflicts++;
            }
        }

        return new ImportState<DesiredGraveType>(created, preserved, conflicts);
    }

    private async Task<ImportState<DesiredCemeteryGraveType>> InspectAssignmentsAsync(
        IReadOnlyList<DesiredCemeteryGraveType> desired,
        IReadOnlyList<CemeteryMasterDataChangeEntity> audits,
        CancellationToken cancellationToken)
    {
        var ids = desired.Select(item => item.Id).ToArray();
        var cemeteryIds = desired.Select(item => item.CemeteryId).Distinct().ToArray();
        var graveTypeIds = desired.Select(item => item.GraveTypeId).Distinct().ToArray();
        var existing = await dbContext.CemeteryGraveTypes.AsNoTracking()
            .Where(item => ids.Contains(item.Id) ||
                           cemeteryIds.Contains(item.CemeteryId) && graveTypeIds.Contains(item.GraveTypeId))
            .ToArrayAsync(cancellationToken);
        var created = new List<DesiredCemeteryGraveType>();
        var preserved = 0;
        var conflicts = 0;
        foreach (var item in desired)
        {
            var sameId = existing.SingleOrDefault(entity => entity.Id == item.Id);
            var colliding = existing.Any(entity => entity.Id != item.Id &&
                entity.CemeteryId == item.CemeteryId && entity.GraveTypeId == item.GraveTypeId);
            if (colliding)
            {
                conflicts++;
            }
            else if (sameId is null)
            {
                created.Add(item);
            }
            else if (AssignmentMatches(sameId, item) &&
                     HasCreationAudit(audits, "CemeteryGraveType", item.Id))
            {
                preserved++;
            }
            else
            {
                conflicts++;
            }
        }

        return new ImportState<DesiredCemeteryGraveType>(created, preserved, conflicts);
    }

    private async Task<ReconciliationState> ReconcileCemeteriesAsync(
        IReadOnlyList<DesiredCemetery> desired,
        IReadOnlyList<CemeteryMasterDataChangeEntity> audits,
        CancellationToken cancellationToken)
    {
        var ids = desired.Select(item => item.Id).ToArray();
        var existing = await dbContext.Cemeteries.AsNoTracking()
            .Where(item => ids.Contains(item.Id))
            .ToArrayAsync(cancellationToken);
        return Reconcile(
            desired,
            existing,
            item => item.Id,
            item => item.Id,
            (entity, item) => CemeteryMatches(entity, item) && HasCreationAudit(audits, "Cemetery", item.Id));
    }

    private async Task<ReconciliationState> ReconcileGraveTypesAsync(
        IReadOnlyList<DesiredGraveType> desired,
        IReadOnlyList<CemeteryMasterDataChangeEntity> audits,
        CancellationToken cancellationToken)
    {
        var ids = desired.Select(item => item.Id).ToArray();
        var existing = await dbContext.GraveTypes.AsNoTracking()
            .Where(item => ids.Contains(item.Id))
            .ToArrayAsync(cancellationToken);
        return Reconcile(
            desired,
            existing,
            item => item.Id,
            item => item.Id,
            (entity, item) => GraveTypeMatches(entity, item) && HasCreationAudit(audits, "GraveType", item.Id));
    }

    private async Task<ReconciliationState> ReconcileAssignmentsAsync(
        IReadOnlyList<DesiredCemeteryGraveType> desired,
        IReadOnlyList<CemeteryMasterDataChangeEntity> audits,
        CancellationToken cancellationToken)
    {
        var ids = desired.Select(item => item.Id).ToArray();
        var existing = await dbContext.CemeteryGraveTypes.AsNoTracking()
            .Where(item => ids.Contains(item.Id))
            .ToArrayAsync(cancellationToken);
        return Reconcile(
            desired,
            existing,
            item => item.Id,
            item => item.Id,
            (entity, item) => AssignmentMatches(entity, item) &&
                              HasCreationAudit(audits, "CemeteryGraveType", item.Id));
    }

    private static ReconciliationState Reconcile<TDesired, TEntity>(
        IReadOnlyList<TDesired> desired,
        IReadOnlyList<TEntity> existing,
        Func<TDesired, Guid> desiredId,
        Func<TEntity, Guid> entityId,
        Func<TEntity, TDesired, bool> matches)
        where TEntity : class
    {
        var matching = 0;
        var conflicting = 0;
        foreach (var item in desired)
        {
            var entity = existing.SingleOrDefault(candidate => entityId(candidate) == desiredId(item));
            if (entity is null)
            {
                continue;
            }

            if (matches(entity, item))
            {
                matching++;
            }
            else
            {
                conflicting++;
            }
        }

        return new ReconciliationState(matching, desired.Count - matching - conflicting, conflicting);
    }

    private static bool CemeteryMatches(CemeteryEntity entity, DesiredCemetery desired) =>
        entity.Name == desired.Name &&
        entity.Code == desired.Code &&
        entity.NormalizedName == desired.NormalizedName &&
        entity.NormalizedCode == desired.NormalizedCode &&
        entity.Address is null &&
        entity.Note is null &&
        entity.IsActive &&
        entity.Version == 1;

    private static bool GraveTypeMatches(GraveTypeEntity entity, DesiredGraveType desired) =>
        entity.Name == desired.Name &&
        entity.Code == desired.Code &&
        entity.NormalizedName == desired.NormalizedName &&
        entity.NormalizedCode == desired.NormalizedCode &&
        entity.BurialForm == desired.BurialForm.ToString() &&
        entity.Note is null &&
        entity.IsActive == desired.IsActive &&
        entity.Version == 1;

    private static bool AssignmentMatches(
        CemeteryGraveTypeEntity entity,
        DesiredCemeteryGraveType desired) =>
        entity.CemeteryId == desired.CemeteryId &&
        entity.GraveTypeId == desired.GraveTypeId &&
        entity.IsActive == desired.IsActive &&
        entity.Version == 1;

    private static bool HasCreationAudit(
        IReadOnlyList<CemeteryMasterDataChangeEntity> audits,
        string entityKind,
        Guid entityId) =>
        audits.Count(item =>
            item.EntityId == entityId &&
            item.EntityKind == entityKind &&
            item.ActorId == MigrationActorId &&
            item.Operation == "Created" &&
            item.ResultingVersion == 1) == 1;

    private static void EnsureSuccess(CemeteryMasterDataMutationResult result)
    {
        if (result.Outcome != CemeteryMasterDataMutationOutcome.Success)
        {
            throw new InvalidOperationException(
                "Der kontrollierte Stammdaten-Store hat den Import vollständig verweigert.");
        }
    }

    private void ValidateExecutionBoundary(
        string? environmentName,
        string? configuredProvider,
        string? configuredExpectedDatabase,
        string confirmation)
    {
        if (!string.Equals(environmentName, "Development", StringComparison.Ordinal) ||
            !string.Equals(configuredProvider, "SqlServer", StringComparison.Ordinal) ||
            !string.Equals(configuredExpectedDatabase, authorizedDatabase, StringComparison.Ordinal) ||
            !string.Equals(confirmation, authorizedDatabase, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Die SQL-Mutation wurde wegen einer unvollständigen Development-Freigabe verweigert.");
        }
    }

    private async Task ValidateDatabaseAsync(CancellationToken cancellationToken)
    {
        if (!dbContext.Database.IsSqlServer())
        {
            throw new InvalidOperationException("Der EDWALT-Stammdatenimport ist ausschließlich für SQL Server zulässig.");
        }

        await dbContext.Database.OpenConnectionAsync(cancellationToken);
        var resolvedDatabase = dbContext.Database.GetDbConnection().Database;
        if (!string.Equals(resolvedDatabase, authorizedDatabase, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Die SQL-Mutation wurde wegen eines abweichend aufgelösten Datenbanknamens verweigert.");
        }

        if ((await dbContext.Database.GetPendingMigrationsAsync(cancellationToken)).Any())
        {
            throw new InvalidOperationException(
                "Der EDWALT-Stammdatenimport erfordert ein vollständig migriertes Schema.");
        }
    }

    private sealed class MigrationActorProvider : ICurrentActorProvider
    {
        public ActorIdentity Current { get; } = new(
            MigrationActorId,
            MigrationActorName,
            SystemRole.Administration);
    }

    private sealed record ImportState<T>(IReadOnlyList<T> Created, int Preserved, int Conflicts);

    private sealed record ReconciliationState(int Matching, int Missing, int Conflicting);
}
