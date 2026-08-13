using Cemaris.Domain.Cemeteries;

namespace Cemaris.UnitTests;

public sealed class CemeteryMasterDataRulesTests
{
    [Fact]
    public void OccupiedGraveSiteCannotBecomeAvailableAgain() =>
        Assert.Throws<CemeteryMasterDataValidationException>(() =>
            CemeteryMasterDataRules.EnsureStatusTransition(GraveSiteStatus.Occupied, GraveSiteStatus.Available));

    [Theory]
    [InlineData(GraveSiteStatus.Available, GraveSiteStatus.Reserved)]
    [InlineData(GraveSiteStatus.Available, GraveSiteStatus.Occupied)]
    [InlineData(GraveSiteStatus.Reserved, GraveSiteStatus.Available)]
    [InlineData(GraveSiteStatus.Reserved, GraveSiteStatus.Occupied)]
    public void ConfirmedStatusTransitionsAreAllowed(GraveSiteStatus current, GraveSiteStatus next) =>
        CemeteryMasterDataRules.EnsureStatusTransition(current, next);

    [Fact]
    public void UniqueKeyIsTrimmedAndCaseInsensitive() =>
        Assert.Equal("SYN-1", CemeteryMasterDataRules.UniqueKey("  syn-1 "));
}
