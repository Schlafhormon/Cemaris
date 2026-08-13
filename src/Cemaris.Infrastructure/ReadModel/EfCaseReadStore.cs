using Cemaris.Application.Cases;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.ReadModel;
using Microsoft.EntityFrameworkCore;

#pragma warning disable CA1304, CA1310, CA1311, CA1862
// These string calls are translated to SQL; comparison overloads with StringComparison are not.

namespace Cemaris.Infrastructure.ReadModel;

public sealed class EfCaseReadStore(CemarisDbContext dbContext) : ICaseReadStore
{
    public async Task<CaseSearchStoreResult> SearchAsync(
        SearchCriteria criteria,
        int maximumResults,
        CancellationToken cancellationToken)
    {
        var filters = NormalizedFilters.From(criteria);
        var filteredCases = ApplyFilters(dbContext.Cases.AsNoTracking(), filters);
        var totalMatches = await filteredCases.CountAsync(cancellationToken);

        var rankedCaseIds = await filteredCases
            .Select(item => new
            {
                item.Id,
                Cemetery = item.Grave == null ? null : item.Grave.GraveSite != null ? item.Grave.GraveSite.Cemetery.Name : item.Grave.Cemetery,
                Field = item.Grave == null ? null : item.Grave.GraveSite != null ? item.Grave.GraveSite.Field == null ? null : item.Grave.GraveSite.Field.Name : item.Grave.Field,
                GraveNumber = item.Grave == null ? null : item.Grave.GraveSite != null ? item.Grave.GraveSite.GraveNumber : item.Grave.GraveNumber,
                ExactMatchCount =
                    (filters.Name != null && item.DeceasedPersons.Any(person =>
                        person.LastName != null
                        && person.LastName.Trim().ToUpper() == filters.Name) ? 1 : 0)
                    + (filters.FirstName != null && item.DeceasedPersons.Any(person =>
                        person.FirstName != null
                        && person.FirstName.Trim().ToUpper() == filters.FirstName) ? 1 : 0)
                    + (filters.BirthDate != null && item.DeceasedPersons.Any(person =>
                        person.BirthDate == filters.BirthDate) ? 1 : 0)
                    + (filters.DeathDate != null && item.DeceasedPersons.Any(person =>
                        person.DeathDate == filters.DeathDate) ? 1 : 0)
                    + (filters.Cemetery != null && item.Grave != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Cemetery.Name : item.Grave.Cemetery).Trim().ToUpper() == filters.Cemetery ? 1 : 0)
                    + (filters.Field != null && item.Grave != null && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Field == null ? null : item.Grave.GraveSite.Field.Name : item.Grave.Field) != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Field!.Name : item.Grave.Field!).Trim().ToUpper() == filters.Field ? 1 : 0)
                    + (filters.GraveNumber != null && item.Grave != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.GraveNumber : item.Grave.GraveNumber) != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.GraveNumber : item.Grave.GraveNumber!).Trim().ToUpper() == filters.GraveNumber ? 1 : 0)
                    + (filters.BurialDate != null && item.Burials.Any(burial =>
                        burial.BurialDate == filters.BurialDate) ? 1 : 0)
                    + (filters.EntitledPerson != null && item.EntitledPersons.Any(person =>
                        (person.FirstName != null
                            && person.FirstName.Trim().ToUpper() == filters.EntitledPerson)
                        || (person.LastName != null
                            && person.LastName.Trim().ToUpper() == filters.EntitledPerson)
                        || (((person.FirstName ?? "") + " " + (person.LastName ?? ""))
                            .Trim().ToUpper() == filters.EntitledPerson)
                        || (person.OrganizationName != null
                            && person.OrganizationName.Trim().ToUpper() == filters.EntitledPerson)) ? 1 : 0)
                    + (filters.Address != null && item.EntitledPersons
                        .SelectMany(person => person.Addresses)
                        .Any(address => (address.Street != null
                                && address.Street.Trim().ToUpper() == filters.Address)
                            || (address.HouseNumber != null
                                && address.HouseNumber.Trim().ToUpper() == filters.Address)
                            || (address.PostalCode != null
                                && address.PostalCode.Trim().ToUpper() == filters.Address)
                            || (address.City != null
                                && address.City.Trim().ToUpper() == filters.Address)
                            || (address.AdditionalInformation != null
                                && address.AdditionalInformation.Trim().ToUpper() == filters.Address)
                            || ((address.Street ?? "") + " "
                                + (address.HouseNumber ?? "") + " "
                                + (address.PostalCode ?? "") + " "
                                + (address.City ?? "") + " "
                                + (address.AdditionalInformation ?? ""))
                                .Trim().ToUpper() == filters.Address) ? 1 : 0)
                    + (filters.NoticeNumber != null && item.Notices.Any(notice =>
                        notice.NoticeNumber != null
                        && notice.NoticeNumber.Trim().ToUpper() == filters.NoticeNumber) ? 1 : 0),
                PrefixMatchCount =
                    (filters.Name != null && item.DeceasedPersons.Any(person =>
                        person.LastName != null
                        && person.LastName.Trim().ToUpper().StartsWith(filters.Name)) ? 1 : 0)
                    + (filters.FirstName != null && item.DeceasedPersons.Any(person =>
                        person.FirstName != null
                        && person.FirstName.Trim().ToUpper().StartsWith(filters.FirstName)) ? 1 : 0)
                    + (filters.BirthDate != null && item.DeceasedPersons.Any(person =>
                        person.BirthDate == filters.BirthDate) ? 1 : 0)
                    + (filters.DeathDate != null && item.DeceasedPersons.Any(person =>
                        person.DeathDate == filters.DeathDate) ? 1 : 0)
                    + (filters.Cemetery != null && item.Grave != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Cemetery.Name : item.Grave.Cemetery).Trim().ToUpper().StartsWith(filters.Cemetery) ? 1 : 0)
                    + (filters.Field != null && item.Grave != null && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Field == null ? null : item.Grave.GraveSite.Field.Name : item.Grave.Field) != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Field!.Name : item.Grave.Field!).Trim().ToUpper().StartsWith(filters.Field) ? 1 : 0)
                    + (filters.GraveNumber != null && item.Grave != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.GraveNumber : item.Grave.GraveNumber) != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.GraveNumber : item.Grave.GraveNumber!).Trim().ToUpper().StartsWith(filters.GraveNumber) ? 1 : 0)
                    + (filters.BurialDate != null && item.Burials.Any(burial =>
                        burial.BurialDate == filters.BurialDate) ? 1 : 0)
                    + (filters.EntitledPerson != null && item.EntitledPersons.Any(person =>
                        (person.FirstName != null
                            && person.FirstName.Trim().ToUpper().StartsWith(filters.EntitledPerson))
                        || (person.LastName != null
                            && person.LastName.Trim().ToUpper().StartsWith(filters.EntitledPerson))
                        || (((person.FirstName ?? "") + " " + (person.LastName ?? ""))
                            .Trim().ToUpper().StartsWith(filters.EntitledPerson))
                        || (person.OrganizationName != null
                            && person.OrganizationName.Trim().ToUpper().StartsWith(filters.EntitledPerson))) ? 1 : 0)
                    + (filters.Address != null && item.EntitledPersons
                        .SelectMany(person => person.Addresses)
                        .Any(address => (address.Street != null
                                && address.Street.Trim().ToUpper().StartsWith(filters.Address))
                            || (address.HouseNumber != null
                                && address.HouseNumber.Trim().ToUpper().StartsWith(filters.Address))
                            || (address.PostalCode != null
                                && address.PostalCode.Trim().ToUpper().StartsWith(filters.Address))
                            || (address.City != null
                                && address.City.Trim().ToUpper().StartsWith(filters.Address))
                            || (address.AdditionalInformation != null
                                && address.AdditionalInformation.Trim().ToUpper().StartsWith(filters.Address))
                            || ((address.Street ?? "") + " "
                                + (address.HouseNumber ?? "") + " "
                                + (address.PostalCode ?? "") + " "
                                + (address.City ?? "") + " "
                                + (address.AdditionalInformation ?? ""))
                                .Trim().ToUpper().StartsWith(filters.Address)) ? 1 : 0)
                    + (filters.NoticeNumber != null && item.Notices.Any(notice =>
                        notice.NoticeNumber != null
                        && notice.NoticeNumber.Trim().ToUpper().StartsWith(filters.NoticeNumber)) ? 1 : 0),
                MatchingValueCount =
                    (filters.Name == null ? 0 : item.DeceasedPersons.Count(person =>
                        person.LastName != null
                        && person.LastName.Trim().ToUpper().Contains(filters.Name)))
                    + (filters.FirstName == null ? 0 : item.DeceasedPersons.Count(person =>
                        person.FirstName != null
                        && person.FirstName.Trim().ToUpper().Contains(filters.FirstName)))
                    + (filters.BirthDate == null ? 0 : item.DeceasedPersons.Count(person =>
                        person.BirthDate == filters.BirthDate))
                    + (filters.DeathDate == null ? 0 : item.DeceasedPersons.Count(person =>
                        person.DeathDate == filters.DeathDate))
                    + (filters.Cemetery != null && item.Grave != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Cemetery.Name : item.Grave.Cemetery).Trim().ToUpper().Contains(filters.Cemetery) ? 1 : 0)
                    + (filters.Field != null && item.Grave != null && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Field == null ? null : item.Grave.GraveSite.Field.Name : item.Grave.Field) != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Field!.Name : item.Grave.Field!).Trim().ToUpper().Contains(filters.Field) ? 1 : 0)
                    + (filters.GraveNumber != null && item.Grave != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.GraveNumber : item.Grave.GraveNumber) != null
                        && (item.Grave.GraveSite != null ? item.Grave.GraveSite.GraveNumber : item.Grave.GraveNumber!).Trim().ToUpper().Contains(filters.GraveNumber) ? 1 : 0)
                    + (filters.BurialDate == null ? 0 : item.Burials.Count(burial =>
                        burial.BurialDate == filters.BurialDate))
                    + (filters.EntitledPerson == null ? 0
                        : item.EntitledPersons.Count(person => person.FirstName != null
                            && person.FirstName.Trim().ToUpper().Contains(filters.EntitledPerson))
                        + item.EntitledPersons.Count(person => person.LastName != null
                            && person.LastName.Trim().ToUpper().Contains(filters.EntitledPerson))
                        + item.EntitledPersons.Count(person =>
                            ((person.FirstName ?? "") + " " + (person.LastName ?? ""))
                                .Trim().ToUpper().Contains(filters.EntitledPerson))
                        + item.EntitledPersons.Count(person => person.OrganizationName != null
                            && person.OrganizationName.Trim().ToUpper().Contains(filters.EntitledPerson)))
                    + (filters.Address == null ? 0
                        : item.EntitledPersons.SelectMany(person => person.Addresses)
                            .Count(address => address.Street != null
                                && address.Street.Trim().ToUpper().Contains(filters.Address))
                        + item.EntitledPersons.SelectMany(person => person.Addresses)
                            .Count(address => address.HouseNumber != null
                                && address.HouseNumber.Trim().ToUpper().Contains(filters.Address))
                        + item.EntitledPersons.SelectMany(person => person.Addresses)
                            .Count(address => address.PostalCode != null
                                && address.PostalCode.Trim().ToUpper().Contains(filters.Address))
                        + item.EntitledPersons.SelectMany(person => person.Addresses)
                            .Count(address => address.City != null
                                && address.City.Trim().ToUpper().Contains(filters.Address))
                        + item.EntitledPersons.SelectMany(person => person.Addresses)
                            .Count(address => address.AdditionalInformation != null
                                && address.AdditionalInformation.Trim().ToUpper().Contains(filters.Address))
                        + item.EntitledPersons.SelectMany(person => person.Addresses)
                            .Count(address => ((address.Street ?? "") + " "
                                + (address.HouseNumber ?? "") + " "
                                + (address.PostalCode ?? "") + " "
                                + (address.City ?? "") + " "
                                + (address.AdditionalInformation ?? ""))
                                .Trim().ToUpper().Contains(filters.Address)))
                    + (filters.NoticeNumber == null ? 0 : item.Notices.Count(notice =>
                        notice.NoticeNumber != null
                        && notice.NoticeNumber.Trim().ToUpper().Contains(filters.NoticeNumber))),
            })
            .OrderByDescending(item => item.ExactMatchCount == filters.ActiveFilterCount)
            .ThenByDescending(item => item.PrefixMatchCount == filters.ActiveFilterCount)
            .ThenByDescending(item => item.MatchingValueCount)
            .ThenBy(item => item.Cemetery)
            .ThenBy(item => item.Field)
            .ThenBy(item => item.GraveNumber)
            .ThenBy(item => item.Id)
            .Take(maximumResults)
            .Select(item => item.Id)
            .ToArrayAsync(cancellationToken);

        if (rankedCaseIds.Length == 0)
        {
            return new CaseSearchStoreResult([], totalMatches);
        }

        var entities = await QueryCases()
            .Where(item => rankedCaseIds.Contains(item.Id))
            .ToArrayAsync(cancellationToken);
        var casesById = entities.ToDictionary(item => item.Id, Map);
        var orderedCases = rankedCaseIds.Select(id => casesById[id]).ToArray();

        return new CaseSearchStoreResult(orderedCases, totalMatches);
    }

    public async Task<CaseOverview?> FindAsync(Guid id, CancellationToken cancellationToken)
    {
        var entity = await QueryCases()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        return entity is null ? null : Map(entity);
    }

    private static IQueryable<CaseReadEntity> ApplyFilters(
        IQueryable<CaseReadEntity> query,
        NormalizedFilters filters)
    {
        if (filters.Name is not null)
        {
            query = query.Where(item => item.DeceasedPersons.Any(person =>
                person.LastName != null
                && person.LastName.Trim().ToUpper().Contains(filters.Name)));
        }

        if (filters.FirstName is not null)
        {
            query = query.Where(item => item.DeceasedPersons.Any(person =>
                person.FirstName != null
                && person.FirstName.Trim().ToUpper().Contains(filters.FirstName)));
        }

        if (filters.BirthDate is not null)
        {
            query = query.Where(item => item.DeceasedPersons.Any(person =>
                person.BirthDate == filters.BirthDate));
        }

        if (filters.DeathDate is not null)
        {
            query = query.Where(item => item.DeceasedPersons.Any(person =>
                person.DeathDate == filters.DeathDate));
        }

        if (filters.Cemetery is not null)
        {
            query = query.Where(item => item.Grave != null
                && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Cemetery.Name : item.Grave.Cemetery).Trim().ToUpper().Contains(filters.Cemetery));
        }

        if (filters.Field is not null)
        {
            query = query.Where(item => item.Grave != null && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Field == null ? null : item.Grave.GraveSite.Field.Name : item.Grave.Field) != null
                && (item.Grave.GraveSite != null ? item.Grave.GraveSite.Field!.Name : item.Grave.Field!).Trim().ToUpper().Contains(filters.Field));
        }

        if (filters.GraveNumber is not null)
        {
            query = query.Where(item => item.Grave != null && (item.Grave.GraveSite != null ? item.Grave.GraveSite.GraveNumber : item.Grave.GraveNumber) != null
                && (item.Grave.GraveSite != null ? item.Grave.GraveSite.GraveNumber : item.Grave.GraveNumber!).Trim().ToUpper().Contains(filters.GraveNumber));
        }

        if (filters.BurialDate is not null)
        {
            query = query.Where(item => item.Burials.Any(burial =>
                burial.BurialDate == filters.BurialDate));
        }

        if (filters.EntitledPerson is not null)
        {
            query = query.Where(item => item.EntitledPersons.Any(person =>
                (person.FirstName != null
                    && person.FirstName.Trim().ToUpper().Contains(filters.EntitledPerson))
                || (person.LastName != null
                    && person.LastName.Trim().ToUpper().Contains(filters.EntitledPerson))
                || (((person.FirstName ?? "") + " " + (person.LastName ?? ""))
                    .Trim().ToUpper().Contains(filters.EntitledPerson))
                || (person.OrganizationName != null
                    && person.OrganizationName.Trim().ToUpper().Contains(filters.EntitledPerson))));
        }

        if (filters.Address is not null)
        {
            query = query.Where(item => item.EntitledPersons
                .SelectMany(person => person.Addresses)
                .Any(address => ((address.Street ?? "") + " "
                    + (address.HouseNumber ?? "") + " "
                    + (address.PostalCode ?? "") + " "
                    + (address.City ?? "") + " "
                    + (address.AdditionalInformation ?? ""))
                    .Trim().ToUpper().Contains(filters.Address)));
        }

        if (filters.NoticeNumber is not null)
        {
            query = query.Where(item => item.Notices.Any(notice =>
                notice.NoticeNumber != null
                && notice.NoticeNumber.Trim().ToUpper().Contains(filters.NoticeNumber)));
        }

        return query;
    }

    private IQueryable<CaseReadEntity> QueryCases() =>
        dbContext.Cases
            .AsNoTracking()
            .AsSplitQuery()
            .Include(item => item.Grave)
                .ThenInclude(item => item!.GraveSite)
                    .ThenInclude(item => item!.Cemetery)
            .Include(item => item.Grave)
                .ThenInclude(item => item!.GraveSite)
                    .ThenInclude(item => item!.Field)
            .Include(item => item.DeceasedPersons)
            .Include(item => item.Burials)
            .Include(item => item.UsageRights)
                .ThenInclude(item => item.Holders)
            .Include(item => item.EntitledPersons)
                .ThenInclude(item => item.Addresses)
            .Include(item => item.Notices)
                .ThenInclude(item => item.FeeItems)
            .Include(item => item.DataQualityNotes);

    private static CaseOverview Map(CaseReadEntity entity)
    {
        var dataQualityNotes = entity.DataQualityNotes.Select(item => item.Text).ToList();
        if (entity.Grave is null)
        {
            dataQualityNotes.Add("Dem Fall ist keine Grabstelle zugeordnet.");
        }

        return new CaseOverview(
            entity.Id,
            entity.IsSynthetic,
            entity.Version,
            new GraveDetails(
                entity.Grave?.GraveSite?.Cemetery.Name ?? entity.Grave?.Cemetery,
                entity.Grave?.GraveSite?.Field?.Name ?? entity.Grave?.Field,
                entity.Grave?.GraveSite?.GraveNumber ?? entity.Grave?.GraveNumber,
                entity.Grave?.GraveSiteId),
            entity.DeceasedPersons
                .Select(item => new DeceasedDetails(
                    item.Id,
                    item.FirstName,
                    item.LastName,
                    item.BirthDate,
                    item.DeathDate))
                .ToArray(),
            entity.Burials
                .Select(item => new BurialDetails(
                    item.Id,
                    item.DeceasedPersonId,
                    item.BurialDate))
                .ToArray(),
            entity.UsageRights
                .Select(item => new UsageRightDetails(
                    item.Id,
                    item.Reference,
                    item.ValidFrom,
                    item.ValidUntil,
                    item.Holders.Select(holder => holder.EntitledPersonId).ToArray()))
                .ToArray(),
            entity.EntitledPersons
                .Select(item => new EntitledPersonDetails(
                    item.Id,
                    item.FirstName,
                    item.LastName,
                    item.OrganizationName,
                    item.Addresses
                        .Select(address => new AddressDetails(
                            address.Id,
                            address.Street,
                            address.HouseNumber,
                            address.PostalCode,
                            address.City,
                            address.AdditionalInformation))
                        .ToArray()))
                .ToArray(),
            entity.Notices
                .Select(item => new NoticeDetails(
                    item.Id,
                    item.NoticeNumber,
                    item.NoticeDate,
                    item.DueDate,
                    item.AssessedAmount,
                    item.CurrencyCode,
                    item.FeeItems
                        .Select(feeItem => new FeeItemDetails(
                            feeItem.Id,
                            feeItem.Description,
                            feeItem.Amount,
                            feeItem.CurrencyCode))
                        .ToArray()))
                .ToArray(),
            dataQualityNotes,
            entity.LastChangedByActorName is null || entity.LastChangedAtUtc is null
                ? null
                : new LastCaseChangeDetails(
                    entity.LastChangedByActorName,
                    entity.LastChangedAtUtc.Value));
    }

    private sealed record NormalizedFilters(
        string? Name,
        string? FirstName,
        DateOnly? BirthDate,
        DateOnly? DeathDate,
        string? Cemetery,
        string? Field,
        string? GraveNumber,
        DateOnly? BurialDate,
        string? EntitledPerson,
        string? Address,
        string? NoticeNumber,
        int ActiveFilterCount)
    {
        public static NormalizedFilters From(SearchCriteria criteria)
        {
            var name = Normalize(criteria.Name);
            var firstName = Normalize(criteria.FirstName);
            var cemetery = Normalize(criteria.Cemetery);
            var field = Normalize(criteria.Field);
            var graveNumber = Normalize(criteria.GraveNumber);
            var entitledPerson = Normalize(criteria.EntitledPerson);
            var address = NormalizeAddress(criteria.Address);
            var noticeNumber = Normalize(criteria.NoticeNumber);
            var activeFilterCount = new object?[]
            {
                name,
                firstName,
                criteria.BirthDate,
                criteria.DeathDate,
                cemetery,
                field,
                graveNumber,
                criteria.BurialDate,
                entitledPerson,
                address,
                noticeNumber,
            }.Count(value => value is not null);

            return new NormalizedFilters(
                name,
                firstName,
                criteria.BirthDate,
                criteria.DeathDate,
                cemetery,
                field,
                graveNumber,
                criteria.BurialDate,
                entitledPerson,
                address,
                noticeNumber,
                activeFilterCount);
        }

        private static string? Normalize(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToUpperInvariant();

        private static string? NormalizeAddress(string? value) =>
            string.IsNullOrWhiteSpace(value)
                ? null
                : string.Join(' ', value
                    .Split([' ', ','], StringSplitOptions.RemoveEmptyEntries)
                    .Select(part => part.ToUpperInvariant()));
    }
}

#pragma warning restore CA1304, CA1310, CA1311, CA1862
