using System.Security.Cryptography;
using System.Text;
using Cemaris.Application.Cases;
using Cemaris.Application.Identity;
using Cemaris.Domain.Cases;
using Cemaris.Domain.Cemeteries;
using Cemaris.Infrastructure.Cemeteries;

namespace Cemaris.Infrastructure.ReadModel;

/// <summary>
/// Repository-safe demonstration data. Every name, address and identifier is
/// intentionally artificial and must never be interpreted as production data.
/// </summary>
public sealed class SyntheticCaseReadStore : ICaseReadStore, ICaseWriteStore, IBurialProcessStore
{
    private static readonly DateTimeOffset SeedChangedAtUtc =
        new(2026, 8, 13, 0, 0, 0, TimeSpan.Zero);

    private readonly object gate;
    private readonly List<CaseOverview> cases;
    private readonly List<CaseChange> changes;
    private readonly SyntheticCemeteryMasterDataStore? masterDataStore;

    public SyntheticCaseReadStore(
        SyntheticCemeteryMasterDataStore? masterDataStore = null,
        SyntheticStoreCoordinator? coordinator = null)
    {
        this.masterDataStore = masterDataStore;
        gate = coordinator?.Gate ?? new object();
        cases = CreateCases().ToList();
        changes = CreateInitialChanges(cases).ToList();
    }

    public Task<CaseSearchStoreResult> SearchAsync(
        SearchCriteria criteria,
        int offset,
        int maximumResults,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (gate)
        {
            return Task.FromResult(InMemoryCaseSearch.Search(ProjectCurrentNames(cases), criteria, maximumResults, offset));
        }
    }

    public Task<CaseOverview?> FindAsync(Guid id, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (gate)
        {
            return Task.FromResult(ProjectCurrentNames(cases).SingleOrDefault(item => item.Id == id));
        }
    }

    private CaseOverview[] ProjectCurrentNames(IEnumerable<CaseOverview> source)
    {
        if (masterDataStore is null) return source.ToArray();
        var snapshot = masterDataStore.ReadAsync(true, CancellationToken.None).GetAwaiter().GetResult();
        var sites = snapshot.GraveSites.ToDictionary(item => item.Id);
        return source.Select(item => item.Grave.GraveSiteId.HasValue && sites.TryGetValue(item.Grave.GraveSiteId.Value, out var site)
            ? item with { Grave = new GraveDetails(site.CemeteryName, site.FieldName, site.GraveNumber, site.Id) }
            : item).ToArray();
    }

    public Task CreateAsync(
        CaseRecord caseRecord,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(caseRecord);
        ValidateChange(
            caseRecord.Id,
            caseRecord.Version,
            CaseChangeOperation.CaseCreated,
            null,
            change);
        cancellationToken.ThrowIfCancellationRequested();

        lock (gate)
        {
            if (cases.Any(item => item.Id == caseRecord.Id))
            {
                throw new InvalidOperationException("Die serverseitig erzeugte Fall-ID ist bereits vorhanden.");
            }

            EnsureChangeCanBeStored(change);
            cases.Add(new CaseOverview(
                caseRecord.Id,
                true,
                caseRecord.Version.Value,
                new GraveDetails(
                    caseRecord.Grave.Cemetery,
                    caseRecord.Grave.Field,
                    caseRecord.Grave.GraveNumber,
                    caseRecord.Grave.GraveSiteId),
                [],
                [],
                [],
                [],
                [],
                ["Ausschließlich synthetische Development-Fallakte."],
                ToLastChange(change)));
            changes.Add(change);
            masterDataStore?.ChangeGraveSiteReference(null, caseRecord.Grave.GraveSiteId);
        }

        return Task.CompletedTask;
    }

    public Task<CaseMutationResult> ChangeGraveAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        GraveReference grave,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(grave);
        return MutateAsync(caseId, expectedVersion, CaseChangeOperation.GraveChanged, null, change, current => current with
        {
            Grave = new GraveDetails(grave.Cemetery, grave.Field, grave.GraveNumber, grave.GraveSiteId),
        }, cancellationToken, onCommitted: (previous, current) =>
            masterDataStore?.ChangeGraveSiteReference(previous.Grave.GraveSiteId, current.Grave.GraveSiteId));
    }

    public Task<CaseMutationResult> AddDeceasedPersonAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(deceasedPerson);
        return MutateAsync(caseId, expectedVersion, CaseChangeOperation.DeceasedPersonAdded, deceasedPerson.Id, change, current => current with
        {
            DeceasedPersons =
            [
                .. current.DeceasedPersons,
                new DeceasedDetails(
                    deceasedPerson.Id,
                    deceasedPerson.FirstName,
                    deceasedPerson.LastName,
                    deceasedPerson.BirthDate,
                    deceasedPerson.DeathDate),
            ],
        }, cancellationToken);
    }

    public Task<CaseMutationResult> ChangeDeceasedPersonAsync(
        Guid caseId,
        Guid personId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(deceasedPerson);
        return MutateAsync(
            caseId,
            expectedVersion,
            CaseChangeOperation.DeceasedPersonChanged,
            personId,
            change,
            current => current with
            {
                DeceasedPersons = current.DeceasedPersons
                    .Select(person => person.Id == personId
                        ? new DeceasedDetails(
                            personId,
                            deceasedPerson.FirstName,
                            deceasedPerson.LastName,
                            deceasedPerson.BirthDate,
                            deceasedPerson.DeathDate)
                        : person)
                    .ToArray(),
            },
            cancellationToken,
            current => current.DeceasedPersons.Any(person => person.Id == personId));
    }

    public Task<CaseMutationResult> AddBurialAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        Burial burial,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(burial);
        return MutateAsync(
            caseId,
            expectedVersion,
            CaseChangeOperation.BurialAdded,
            burial.Id,
            change,
            current => current with
            {
                Burials =
                [
                    .. current.Burials,
                    new BurialDetails(burial.Id, burial.DeceasedPersonId, burial.BurialDate),
                ],
            },
            cancellationToken,
            referenceIsValid: current => burial.DeceasedPersonId is null
                || current.DeceasedPersons.Any(person => person.Id == burial.DeceasedPersonId));
    }

    public Task<CaseMutationResult> ChangeBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        Burial burial,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(burial);
        return MutateAsync(
            caseId,
            expectedVersion,
            CaseChangeOperation.BurialChanged,
            burialId,
            change,
            current => current with
            {
                Burials = current.Burials
                    .Select(item => item.Id == burialId
                        ? new BurialDetails(burialId, burial.DeceasedPersonId, burial.BurialDate)
                        : item)
                    .ToArray(),
            },
            cancellationToken,
            current => current.Burials.Any(item => item.Id == burialId),
            current => burial.DeceasedPersonId is null
                || current.DeceasedPersons.Any(person => person.Id == burial.DeceasedPersonId));
    }

    Task<BurialProcessMutationResult> IBurialProcessStore.AddDeceasedPersonAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        bool confirmPossibleDuplicate,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var nextVersion = expectedVersion.Next();
        ValidateChange(
            caseId,
            nextVersion,
            CaseChangeOperation.DeceasedPersonAdded,
            deceasedPerson.Id,
            change);

        lock (gate)
        {
            var failed = FindProcessMutationTarget(caseId, expectedVersion, out var index, out var current);
            if (failed is not null)
            {
                return Task.FromResult(failed);
            }

            var details = new DeceasedDetails(
                deceasedPerson.Id,
                deceasedPerson.FirstName,
                deceasedPerson.LastName,
                deceasedPerson.BirthDate,
                deceasedPerson.DeathDate);
            var candidates = PossibleDuplicateMatcher.Find(current.DeceasedPersons, details);
            if (candidates.Count > 0 && !confirmPossibleDuplicate)
            {
                return Task.FromResult(BurialProcessMutationResult.Duplicate(candidates));
            }

            var changed = current with
            {
                DeceasedPersons = [.. current.DeceasedPersons, details],
            };
            return Task.FromResult(CommitProcessMutation(index, changed, nextVersion, change));
        }
    }

    Task<BurialProcessMutationResult> IBurialProcessStore.ChangeDeceasedPersonAsync(
        Guid caseId,
        Guid personId,
        CaseVersion expectedVersion,
        DeceasedPerson deceasedPerson,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var nextVersion = expectedVersion.Next();
        ValidateChange(
            caseId,
            nextVersion,
            CaseChangeOperation.DeceasedPersonChanged,
            personId,
            change);

        lock (gate)
        {
            var failed = FindProcessMutationTarget(caseId, expectedVersion, out var index, out var current);
            if (failed is not null)
            {
                return Task.FromResult(failed);
            }

            if (!current.DeceasedPersons.Any(item => item.Id == personId))
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.ChildNotFound));
            }

            foreach (var burial in current.Burials.Where(item =>
                item.DeceasedPersonId == personId && item.Status.HasValue))
            {
                BurialProcessRules.Validate(
                    ToProcessRecord(burial),
                    deceasedPerson.BirthDate,
                    deceasedPerson.DeathDate,
                    today);
            }

            var changed = current with
            {
                DeceasedPersons = current.DeceasedPersons.Select(item => item.Id == personId
                    ? new DeceasedDetails(
                        personId,
                        deceasedPerson.FirstName,
                        deceasedPerson.LastName,
                        deceasedPerson.BirthDate,
                        deceasedPerson.DeathDate)
                    : item).ToArray(),
            };
            return Task.FromResult(CommitProcessMutation(index, changed, nextVersion, change));
        }
    }

    Task<BurialProcessMutationResult> IBurialProcessStore.CreateBurialAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        BurialProcessRecord burial,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var nextVersion = expectedVersion.Next();
        ValidateChange(
            caseId,
            nextVersion,
            CaseChangeOperation.BurialDraftCreated,
            burial.Id,
            change);

        lock (gate)
        {
            var failed = FindProcessMutationTarget(caseId, expectedVersion, out var index, out var current);
            if (failed is not null)
            {
                return Task.FromResult(failed);
            }

            var person = current.DeceasedPersons.SingleOrDefault(item => item.Id == burial.DeceasedPersonId);
            if (person is null)
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.InvalidDeceasedPersonReference));
            }

            if (current.Burials.Any(item =>
                item.Status.HasValue && item.DeceasedPersonId == burial.DeceasedPersonId))
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.DeceasedPersonAlreadyHasBurial));
            }

            BurialProcessRules.Validate(burial, person.BirthDate, person.DeathDate, today);
            if (!CanUseGraveSite(burial.GraveSiteId, true))
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.InvalidGraveSiteReference));
            }

            var changed = current with
            {
                Burials =
                [
                    .. current.Burials,
                    new BurialDetails(
                        burial.Id,
                        burial.DeceasedPersonId,
                        burial.ActualBurialDate,
                        burial.GraveSiteId,
                        burial.Status,
                        burial.PlanningDate),
                ],
            };
            return Task.FromResult(CommitProcessMutation(index, changed, nextVersion, change));
        }
    }

    Task<BurialProcessMutationResult> IBurialProcessStore.ChangeBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        ChangeBurialProcessCommand command,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var nextVersion = expectedVersion.Next();
        ValidateChange(
            caseId,
            nextVersion,
            CaseChangeOperation.BurialFactsChanged,
            burialId,
            change);

        lock (gate)
        {
            var failed = FindProcessMutationTarget(caseId, expectedVersion, out var index, out var current);
            if (failed is not null)
            {
                return Task.FromResult(failed);
            }

            var existing = current.Burials.SingleOrDefault(item => item.Id == burialId);
            if (existing is null)
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.ChildNotFound));
            }

            if (!existing.Status.HasValue)
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.InvalidProcessState));
            }

            try
            {
                BurialProcessRules.EnsureEditable(existing.Status.Value);
            }
            catch (BurialProcessValidationException)
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.InvalidProcessState));
            }

            if ((existing.Status is BurialProcessStatus.Draft or BurialProcessStatus.Planned
                    && command.ActualBurialDate != existing.BurialDate)
                || (existing.Status == BurialProcessStatus.Performed
                    && command.PlanningDate != existing.PlanningDate))
            {
                throw new BurialProcessValidationException(
                    existing.Status == BurialProcessStatus.Performed ? "planningDate" : "actualBurialDate",
                    "Dieses Datum ist im aktuellen Prozesszustand nicht bearbeitbar.");
            }

            var person = current.DeceasedPersons.SingleOrDefault(item => item.Id == command.DeceasedPersonId);
            if (person is null)
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.InvalidDeceasedPersonReference));
            }

            if (current.Burials.Any(item => item.Id != burialId
                && item.Status.HasValue
                && item.DeceasedPersonId == command.DeceasedPersonId))
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.DeceasedPersonAlreadyHasBurial));
            }

            var proposed = BurialProcessRecord.Create(
                burialId,
                command.DeceasedPersonId,
                command.GraveSiteId,
                existing.Status.Value,
                command.PlanningDate,
                command.ActualBurialDate);
            BurialProcessRules.Validate(proposed, person.BirthDate, person.DeathDate, today);

            var changedSite = existing.GraveSiteId != command.GraveSiteId;
            var minimumStatus = existing.Status == BurialProcessStatus.Performed
                ? GraveSiteStatus.Occupied
                : (GraveSiteStatus?)null;
            if (!CanUseGraveSite(command.GraveSiteId, changedSite))
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.InvalidGraveSiteReference));
            }

            var changed = current with
            {
                Burials = current.Burials.Select(item => item.Id == burialId
                    ? new BurialDetails(
                        burialId,
                        proposed.DeceasedPersonId,
                        proposed.ActualBurialDate,
                        proposed.GraveSiteId,
                        proposed.Status,
                        proposed.PlanningDate)
                    : item).ToArray(),
            };
            return Task.FromResult(CommitProcessMutation(
                index,
                changed,
                nextVersion,
                change,
                command.GraveSiteId,
                minimumStatus,
                changedSite));
        }
    }

    Task<BurialProcessMutationResult> IBurialProcessStore.TransitionBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        TransitionBurialCommand command,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var nextVersion = expectedVersion.Next();

        lock (gate)
        {
            var failed = FindProcessMutationTarget(caseId, expectedVersion, out var index, out var current);
            if (failed is not null)
            {
                return Task.FromResult(failed);
            }

            var existing = current.Burials.SingleOrDefault(item => item.Id == burialId);
            if (existing is null)
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.ChildNotFound));
            }

            if (!existing.Status.HasValue
                || !BurialProcessRules.IsTransitionAllowed(existing.Status.Value, command.TargetStatus))
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.InvalidProcessState));
            }

            var expectedOperation = TransitionOperation(existing.Status.Value, command.TargetStatus);
            ValidateChange(caseId, nextVersion, expectedOperation, burialId, change);

            if ((existing.Status != BurialProcessStatus.Draft
                    && command.PlanningDate.HasValue
                    && command.PlanningDate != existing.PlanningDate)
                || (existing.Status != BurialProcessStatus.Confirmed
                    && command.ActualBurialDate.HasValue
                    && command.ActualBurialDate != existing.BurialDate))
            {
                throw new BurialProcessValidationException(
                    "status",
                    "Datumsangaben dürfen nur beim jeweils vorgesehenen Vorwärtsschritt ergänzt werden.");
            }

            var planningDate = existing.Status == BurialProcessStatus.Draft
                ? command.PlanningDate ?? existing.PlanningDate
                : existing.PlanningDate;
            var actualDate = existing.Status == BurialProcessStatus.Confirmed
                ? command.ActualBurialDate ?? existing.BurialDate
                : existing.BurialDate;
            var proposed = BurialProcessRecord.Create(
                burialId,
                existing.DeceasedPersonId!.Value,
                existing.GraveSiteId!.Value,
                command.TargetStatus,
                planningDate,
                actualDate);
            var person = current.DeceasedPersons.Single(item => item.Id == proposed.DeceasedPersonId);
            BurialProcessRules.Validate(proposed, person.BirthDate, person.DeathDate, today);

            var minimumStatus = command.TargetStatus switch
            {
                BurialProcessStatus.Confirmed => GraveSiteStatus.Reserved,
                BurialProcessStatus.Performed => GraveSiteStatus.Occupied,
                _ => (GraveSiteStatus?)null,
            };
            var requireSelectable = command.TargetStatus == BurialProcessStatus.Confirmed;
            if (requireSelectable
                ? masterDataStore?.CanConfirmForBurialProcess(proposed.GraveSiteId) != true
                : !CanUseGraveSite(proposed.GraveSiteId, false))
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.InvalidGraveSiteReference));
            }

            var changed = current with
            {
                Burials = current.Burials.Select(item => item.Id == burialId
                    ? new BurialDetails(
                        burialId,
                        proposed.DeceasedPersonId,
                        proposed.ActualBurialDate,
                        proposed.GraveSiteId,
                        proposed.Status,
                        proposed.PlanningDate)
                    : item).ToArray(),
            };
            return Task.FromResult(CommitProcessMutation(
                index,
                changed,
                nextVersion,
                change,
                proposed.GraveSiteId,
                minimumStatus,
                false));
        }
    }

    Task<BurialProcessMutationResult> IBurialProcessStore.AdoptLegacyBurialAsync(
        Guid caseId,
        Guid burialId,
        CaseVersion expectedVersion,
        AdoptLegacyBurialCommand command,
        DateOnly today,
        CaseChange change,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var nextVersion = expectedVersion.Next();
        ValidateChange(
            caseId,
            nextVersion,
            CaseChangeOperation.LegacyBurialAdopted,
            burialId,
            change);

        lock (gate)
        {
            var failed = FindProcessMutationTarget(caseId, expectedVersion, out var index, out var current);
            if (failed is not null)
            {
                return Task.FromResult(failed);
            }

            var existing = current.Burials.SingleOrDefault(item => item.Id == burialId);
            if (existing is null)
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.ChildNotFound));
            }

            if (existing.Status.HasValue)
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.InvalidProcessState));
            }

            var person = current.DeceasedPersons.SingleOrDefault(item => item.Id == command.DeceasedPersonId);
            if (person is null)
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.InvalidDeceasedPersonReference));
            }

            if (current.Burials.Any(item => item.Id != burialId
                && item.Status.HasValue
                && item.DeceasedPersonId == command.DeceasedPersonId))
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.DeceasedPersonAlreadyHasBurial));
            }

            var proposed = BurialProcessRecord.Create(
                burialId,
                command.DeceasedPersonId,
                command.GraveSiteId,
                command.TargetStatus,
                command.PlanningDate,
                command.ActualBurialDate ?? existing.BurialDate);
            BurialProcessRules.Validate(proposed, person.BirthDate, person.DeathDate, today);
            if (!CanUseGraveSite(proposed.GraveSiteId, true))
            {
                return Task.FromResult(BurialProcessMutationResult.Failed(
                    BurialProcessMutationOutcome.InvalidGraveSiteReference));
            }

            var minimumStatus = proposed.Status switch
            {
                BurialProcessStatus.Confirmed => GraveSiteStatus.Reserved,
                BurialProcessStatus.Performed or BurialProcessStatus.Completed => GraveSiteStatus.Occupied,
                _ => (GraveSiteStatus?)null,
            };
            var changed = current with
            {
                Burials = current.Burials.Select(item => item.Id == burialId
                    ? new BurialDetails(
                        burialId,
                        proposed.DeceasedPersonId,
                        proposed.ActualBurialDate,
                        proposed.GraveSiteId,
                        proposed.Status,
                        proposed.PlanningDate)
                    : item).ToArray(),
            };
            return Task.FromResult(CommitProcessMutation(
                index,
                changed,
                nextVersion,
                change,
                proposed.GraveSiteId,
                minimumStatus,
                true));
        }
    }

    private BurialProcessMutationResult? FindProcessMutationTarget(
        Guid caseId,
        CaseVersion expectedVersion,
        out int index,
        out CaseOverview current)
    {
        index = cases.FindIndex(item => item.Id == caseId && item.IsSynthetic);
        if (index < 0)
        {
            current = null!;
            return BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.CaseNotFound);
        }

        current = cases[index];
        return current.Version == expectedVersion.Value
            ? null
            : BurialProcessMutationResult.Failed(BurialProcessMutationOutcome.VersionConflict);
    }

    private BurialProcessMutationResult CommitProcessMutation(
        int index,
        CaseOverview changed,
        CaseVersion nextVersion,
        CaseChange change,
        Guid? graveSiteId = null,
        GraveSiteStatus? minimumStatus = null,
        bool requireSelectable = false)
    {
        EnsureChangeCanBeStored(change);
        if (graveSiteId.HasValue
            && (masterDataStore is null
                || !masterDataStore.PromoteForBurialProcess(
                    graveSiteId.Value,
                    minimumStatus,
                    requireSelectable)))
        {
            return BurialProcessMutationResult.Failed(
                BurialProcessMutationOutcome.InvalidGraveSiteReference);
        }

        changes.Add(change);
        cases[index] = changed with
        {
            Version = nextVersion.Value,
            LastChange = ToLastChange(change),
        };
        return BurialProcessMutationResult.Succeeded(nextVersion);
    }

    private bool CanUseGraveSite(Guid graveSiteId, bool requireSelectable) =>
        masterDataStore?.CanUseForBurialProcess(graveSiteId, requireSelectable) == true;

    private static BurialProcessRecord ToProcessRecord(BurialDetails burial) =>
        BurialProcessRecord.Create(
            burial.Id,
            burial.DeceasedPersonId!.Value,
            burial.GraveSiteId!.Value,
            burial.Status!.Value,
            burial.PlanningDate,
            burial.BurialDate);

    private static CaseChangeOperation TransitionOperation(
        BurialProcessStatus current,
        BurialProcessStatus target) => (current, target) switch
        {
            (BurialProcessStatus.Draft, BurialProcessStatus.Planned) => CaseChangeOperation.BurialPlanned,
            (BurialProcessStatus.Planned, BurialProcessStatus.Draft) => CaseChangeOperation.BurialPlanningWithdrawn,
            (BurialProcessStatus.Planned, BurialProcessStatus.Confirmed) => CaseChangeOperation.BurialConfirmed,
            (BurialProcessStatus.Confirmed, BurialProcessStatus.Planned) => CaseChangeOperation.BurialConfirmationWithdrawn,
            (BurialProcessStatus.Confirmed, BurialProcessStatus.Performed) => CaseChangeOperation.BurialPerformed,
            (BurialProcessStatus.Performed, BurialProcessStatus.Completed) => CaseChangeOperation.BurialCompleted,
            (BurialProcessStatus.Completed, BurialProcessStatus.Performed) => CaseChangeOperation.BurialReopened,
            _ => throw new InvalidOperationException("Unbekannter Beisetzungsprozessübergang."),
        };

    private Task<CaseMutationResult> MutateAsync(
        Guid caseId,
        CaseVersion expectedVersion,
        CaseChangeOperation operation,
        Guid? targetEntityId,
        CaseChange change,
        Func<CaseOverview, CaseOverview> mutation,
        CancellationToken cancellationToken,
        Func<CaseOverview, bool>? childExists = null,
        Func<CaseOverview, bool>? referenceIsValid = null,
        Action<CaseOverview, CaseOverview>? onCommitted = null)
    {
        var nextVersion = expectedVersion.Next();
        ValidateChange(caseId, nextVersion, operation, targetEntityId, change);
        cancellationToken.ThrowIfCancellationRequested();

        lock (gate)
        {
            var index = cases.FindIndex(item => item.Id == caseId);
            if (index < 0)
            {
                return Task.FromResult(CaseMutationResult.Failed(CaseMutationOutcome.CaseNotFound));
            }

            var current = cases[index];
            if (!current.IsSynthetic)
            {
                return Task.FromResult(CaseMutationResult.Failed(CaseMutationOutcome.CaseNotFound));
            }

            if (current.Version != expectedVersion.Value)
            {
                return Task.FromResult(CaseMutationResult.Failed(CaseMutationOutcome.VersionConflict));
            }

            if (childExists is not null && !childExists(current))
            {
                return Task.FromResult(CaseMutationResult.Failed(CaseMutationOutcome.ChildNotFound));
            }

            if (referenceIsValid is not null && !referenceIsValid(current))
            {
                return Task.FromResult(CaseMutationResult.Failed(
                    CaseMutationOutcome.InvalidDeceasedPersonReference));
            }

            var changedCase = mutation(current) with
            {
                Version = nextVersion.Value,
                LastChange = ToLastChange(change),
            };
            EnsureChangeCanBeStored(change);
            onCommitted?.Invoke(current, changedCase);
            changes.Add(change);
            cases[index] = changedCase;
            return Task.FromResult(CaseMutationResult.Succeeded(nextVersion));
        }
    }

    internal IReadOnlyList<CaseChange> GetChanges(Guid caseId)
    {
        lock (gate)
        {
            return changes.Where(item => item.CaseId == caseId).ToArray();
        }
    }

    internal static IReadOnlyList<CaseOverview> CreateCases()
    {
        var cases = new List<CaseOverview>
        {
            CreateLinkedExample(),
            CreateIncompleteExample(),
        };

        for (var index = 3; index <= 15; index++)
        {
            cases.Add(CreateGeneratedExample(index));
        }

        return cases
            .Select(item => item with
            {
                LastChange = new LastCaseChangeDetails(
                    SyntheticDevelopmentActorProvider.ActorDisplayName,
                    SeedChangedAtUtc),
            })
            .ToArray();
    }

    internal static IReadOnlyList<CaseChange> CreateInitialChanges(
        IReadOnlyList<CaseOverview> cases) =>
        cases.Select(item => new CaseChange(
            DeterministicId($"case-change:{item.Id}:1"),
            item.Id,
            new CaseVersion(item.Version),
            SeedChangedAtUtc,
            SyntheticDevelopmentActorProvider.Actor,
            CaseChangeOperation.CaseCreated,
            null)).ToArray();

    private static LastCaseChangeDetails ToLastChange(CaseChange change) =>
        new(change.Actor.DisplayName, change.OccurredAtUtc);

    private void EnsureChangeCanBeStored(CaseChange change)
    {
        if (changes.Any(item => item.Id == change.Id)
            || changes.Any(item => item.CaseId == change.CaseId
                && item.ResultingVersion == change.ResultingVersion))
        {
            throw new InvalidOperationException(
                "Der Änderungsnachweis kann nicht eindeutig gespeichert werden.");
        }
    }

    private static void ValidateChange(
        Guid caseId,
        CaseVersion resultingVersion,
        CaseChangeOperation operation,
        Guid? targetEntityId,
        CaseChange change)
    {
        ArgumentNullException.ThrowIfNull(change);
        if (change.CaseId != caseId
            || change.ResultingVersion != resultingVersion
            || change.Operation != operation
            || change.TargetEntityId != targetEntityId)
        {
            throw new InvalidOperationException(
                "Der Änderungsnachweis passt nicht zur auszuführenden Fallaktenmutation.");
        }
    }

    private static Guid DeterministicId(string value)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return new Guid(hash.AsSpan(0, 16));
    }

    private static CaseOverview CreateLinkedExample()
    {
        var firstDeceasedId = Id(101);
        var secondDeceasedId = Id(102);
        var entitledPersonId = Id(201);

        return new CaseOverview(
            Id(1),
            true,
            CaseVersion.InitialValue,
            new GraveDetails("Synthetischer Testfriedhof Nord", "Testfeld A", "1001"),
            [
                new DeceasedDetails(
                    firstDeceasedId,
                    "Erika-Test",
                    "Muster-Testperson",
                    new DateOnly(1940, 1, 2),
                    new DateOnly(2024, 2, 3)),
                new DeceasedDetails(
                    secondDeceasedId,
                    "Emil-Test",
                    "Muster-Testperson",
                    new DateOnly(1938, 4, 5),
                    new DateOnly(2020, 6, 7)),
            ],
            [
                new BurialDetails(Id(301), firstDeceasedId, new DateOnly(2024, 2, 12)),
                new BurialDetails(Id(302), secondDeceasedId, new DateOnly(2020, 6, 15)),
            ],
            [
                new UsageRightDetails(
                    Id(401),
                    "SYN-NR-2020-001",
                    new DateOnly(2020, 6, 15),
                    new DateOnly(2040, 6, 14),
                    [entitledPersonId]),
            ],
            [
                new EntitledPersonDetails(
                    entitledPersonId,
                    "Alex-Test",
                    "Beispielperson",
                    null,
                    [
                        new AddressDetails(
                            Id(501),
                            "Künstlicher Testweg",
                            "1",
                            "00000",
                            "Beispielstadt",
                            "Synthetische Hauptanschrift"),
                        new AddressDetails(
                            Id(502),
                            "Demoallee",
                            "2",
                            "00001",
                            "Testort",
                            "Synthetische Nebenanschrift"),
                    ]),
            ],
            [
                new NoticeDetails(
                    Id(601),
                    "SYN-B-2024-0001",
                    new DateOnly(2024, 2, 20),
                    new DateOnly(2024, 3, 20),
                    1250.00m,
                    "EUR",
                    [
                        new FeeItemDetails(
                            Id(701),
                            "Synthetische Gebührenposition A",
                            1000.00m,
                            "EUR"),
                        new FeeItemDetails(
                            Id(702),
                            "Synthetische Gebührenposition B",
                            250.00m,
                            "EUR"),
                    ]),
            ],
            ["Alle Angaben dieses Falls sind ausschließlich synthetische Demonstrationsdaten."]);
    }

    private static CaseOverview CreateIncompleteExample()
    {
        var deceasedId = Id(110);
        var missingEntitledPersonId = Id(299);

        return new CaseOverview(
            Id(2),
            true,
            CaseVersion.InitialValue,
            new GraveDetails("Synthetischer Testfriedhof Süd", null, "2"),
            [
                new DeceasedDetails(
                    deceasedId,
                    null,
                    "Unvollständige-Testperson",
                    null,
                    new DateOnly(2023, 8, 9)),
            ],
            [new BurialDetails(Id(310), null, new DateOnly(2023, 8, 18))],
            [
                new UsageRightDetails(
                    Id(410),
                    null,
                    new DateOnly(2023, 8, 18),
                    null,
                    [missingEntitledPersonId]),
            ],
            [],
            [
                new NoticeDetails(
                    Id(610),
                    "2",
                    null,
                    null,
                    null,
                    null,
                    []),
            ],
            [
                "Die Beisetzung ist absichtlich keiner verstorbenen Person zugeordnet.",
                "Der technische Berechtigtenbezug verweist absichtlich auf keinen vorhandenen Datensatz.",
                "Feld, Vorname und mehrere Bescheidangaben fehlen absichtlich.",
            ]);
    }

    private static CaseOverview CreateGeneratedExample(int index)
    {
        var deceasedId = Id(1000 + index);
        var entitledPersonId = Id(2000 + index);

        return new CaseOverview(
            Id(index),
            true,
            CaseVersion.InitialValue,
            new GraveDetails(
                index % 2 == 0
                    ? "Synthetischer Testfriedhof Nord"
                    : "Synthetischer Testfriedhof West",
                $"Testfeld {index:00}",
                $"{1000 + index}"),
            [
                new DeceasedDetails(
                    deceasedId,
                    $"Testvorname-{index:00}",
                    $"Synthetische-Person-{index:00}",
                    new DateOnly(1940 + index, 1, 1),
                    new DateOnly(2020 + (index % 5), 2, 1)),
            ],
            [
                new BurialDetails(
                    Id(3000 + index),
                    deceasedId,
                    new DateOnly(2020 + (index % 5), 2, 10)),
            ],
            [
                new UsageRightDetails(
                    Id(4000 + index),
                    $"SYN-NR-{index:000}",
                    new DateOnly(2020 + (index % 5), 2, 10),
                    new DateOnly(2040 + (index % 5), 2, 9),
                    [entitledPersonId]),
            ],
            [
                new EntitledPersonDetails(
                    entitledPersonId,
                    $"Testberechtigt-{index:00}",
                    $"Beispiel-{index:00}",
                    null,
                    [
                        new AddressDetails(
                            Id(5000 + index),
                            "Künstlicher Datenweg",
                            index.ToString(System.Globalization.CultureInfo.InvariantCulture),
                            "00000",
                            "Beispielstadt",
                            "Nur Testdaten"),
                    ]),
            ],
            [
                new NoticeDetails(
                    Id(6000 + index),
                    $"SYN-B-2024-{index:0000}",
                    new DateOnly(2024, 3, 1),
                    new DateOnly(2024, 4, 1),
                    index * 100m,
                    "EUR",
                    [
                        new FeeItemDetails(
                            Id(7000 + index),
                            $"Synthetische Gebührenposition {index:00}",
                            index * 100m,
                            "EUR"),
                    ]),
            ],
            ["Automatisch erzeugter, vollständig synthetischer MVP-Demonstrationsfall."]);
    }

    private static Guid Id(int value) =>
        Guid.Parse($"00000000-0000-0000-0000-{value:000000000000}");
}
