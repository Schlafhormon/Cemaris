using Cemaris.Application.Cases;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.Persistence.ReadModel;
using Microsoft.EntityFrameworkCore;

namespace Cemaris.Infrastructure.ReadModel;

public sealed class EfCaseReadStore(CemarisDbContext dbContext) : ICaseReadStore
{
    public async Task<IReadOnlyList<CaseOverview>> ListAsync(CancellationToken cancellationToken)
    {
        var entities = await QueryCases().ToArrayAsync(cancellationToken);
        return entities.Select(Map).ToArray();
    }

    public async Task<CaseOverview?> FindAsync(Guid id, CancellationToken cancellationToken)
    {
        var entity = await QueryCases()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        return entity is null ? null : Map(entity);
    }

    private IQueryable<CaseReadEntity> QueryCases() =>
        dbContext.Cases
            .AsNoTracking()
            .AsSplitQuery()
            .Include(item => item.Grave)
            .Include(item => item.DeceasedPersons)
            .Include(item => item.Burials)
            .Include(item => item.UsageRights)
                .ThenInclude(item => item.Holders)
            .Include(item => item.EntitledPersons)
                .ThenInclude(item => item.Addresses)
            .Include(item => item.Notices)
                .ThenInclude(item => item.FeeItems)
            .Include(item => item.DataQualityNotes);

    private static CaseOverview Map(CaseReadEntity entity) =>
        new(
            entity.Id,
            entity.IsSynthetic,
            new GraveDetails(
                entity.Grave.Cemetery,
                entity.Grave.Field,
                entity.Grave.GraveNumber),
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
            entity.DataQualityNotes.Select(item => item.Text).ToArray());
}
