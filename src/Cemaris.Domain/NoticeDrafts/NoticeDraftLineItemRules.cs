using System.Globalization;
using System.Text.RegularExpressions;

namespace Cemaris.Domain.NoticeDrafts;

public enum NoticeDraftAmountMode { LegacyTotal = 0, LineItems = 1 }

public sealed record NoticeDraftLineItem(Guid Id, int Position, string Description, decimal Amount)
{
    public string AmountExact => NoticeDraftLineItemRules.Exact(Amount);
}

public sealed record PreparedNoticeDraftLineItem(Guid? Id, string Description, decimal Amount);

public static partial class NoticeDraftLineItemRules
{
    public const int MaximumCount = 100;

    [GeneratedRegex(@"^[0-9]{1,16}(\.[0-9]{1,2})?$", RegexOptions.CultureInvariant)]
    private static partial Regex AmountPattern();

    public static string Exact(decimal amount) => amount.ToString("0.00", CultureInfo.InvariantCulture);

    public static decimal ParseAmount(string? value, string field)
    {
        if (value is null || !AmountPattern().IsMatch(value)
            || !decimal.TryParse(value, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var amount)
            || amount <= 0 || amount > NoticeDraftRules.MaximumAmount)
            throw new NoticeDraftValidationException(field, "Ein positiver EUR-Betrag mit höchstens zwei Nachkommastellen ist erforderlich (Dezimalpunkt, keine Gruppierung).");
        return amount;
    }

    public static string Description(string? value, string field)
    {
        var clean = value?.Trim();
        if (string.IsNullOrEmpty(clean) || clean.Length > 500 || clean.Any(char.IsControl))
            throw new NoticeDraftValidationException(field, "Die Bezeichnung muss 1 bis 500 Zeichen ohne Steuerzeichen enthalten.");
        return clean;
    }

    public static decimal Total(IReadOnlyList<PreparedNoticeDraftLineItem>? items)
    {
        if (items is null || items.Count is < 1 or > MaximumCount)
            throw new NoticeDraftValidationException("lineItems", "Es sind 1 bis 100 Positionen erforderlich.");
        decimal total = 0;
        var ids = new HashSet<Guid>();
        for (var index = 0; index < items.Count; index++)
        {
            var item = items[index];
            if (item is null) throw new NoticeDraftValidationException($"lineItems[{index}]", "Die Position ist erforderlich.");
            if (item.Id.HasValue && (item.Id == Guid.Empty || !ids.Add(item.Id.Value)))
                throw new NoticeDraftValidationException($"lineItems[{index}].id", "Die Positionsidentität ist ungültig oder doppelt.");
            Description(item.Description, $"lineItems[{index}].description");
            try { NoticeDraftRules.ValidateAmount(item.Amount); }
            catch (NoticeDraftValidationException) { throw new NoticeDraftValidationException($"lineItems[{index}].amount", "Der Betrag muss positiv sein und höchstens zwei Nachkommastellen besitzen."); }
            total += item.Amount;
            if (total > NoticeDraftRules.MaximumAmount)
                throw new NoticeDraftValidationException("lineItems", "Die Gesamtsumme überschreitet den zulässigen EUR-Höchstbetrag.");
        }
        return total;
    }

    public static IReadOnlyList<NoticeDraftLineItem> Materialize(
        IReadOnlyList<PreparedNoticeDraftLineItem> items, IEnumerable<Guid> existingIds)
    {
        Total(items);
        var existing = existingIds.ToHashSet();
        for (var index = 0; index < items.Count; index++)
            if (items[index].Id is { } id && !existing.Contains(id))
                throw new NoticeDraftValidationException($"lineItems[{index}].id", "Die Position gehört nicht zum aktuellen Entwurf.");
        return Array.AsReadOnly(items.Select((item, index) => new NoticeDraftLineItem(
            item.Id ?? Guid.NewGuid(), index + 1, Description(item.Description, $"lineItems[{index}].description"), item.Amount)).ToArray());
    }
}
