namespace Cemaris.Domain.NoticeDrafts;

public enum NoticeDraftStatus
{
    Draft = 1,
    Discarded = 2,
}

public static class NoticeDraftRules
{
    public const string Currency = "EUR";
    public const decimal MaximumAmount = 9_999_999_999_999_999.99m;

    public static decimal ValidateAmount(decimal amount)
    {
        if (amount <= 0 || amount > MaximumAmount)
        {
            throw new NoticeDraftValidationException(
                "totalAmount",
                "Der Gesamtbetrag muss positiv sein und in decimal(18,2) passen.");
        }

        var scale = (decimal.GetBits(amount)[3] >> 16) & 0xff;
        if (scale > 2)
        {
            throw new NoticeDraftValidationException(
                "totalAmount",
                "Der Gesamtbetrag darf höchstens zwei Nachkommastellen besitzen; er wird nicht gerundet.");
        }

        return amount;
    }

    public static string FinancialProduct(string? value) => Required(value, 50, "financialProduct");
    public static string AccountAssignment(string? value) => Required(value, 100, "accountAssignment");
    public static string FeeReasonOrSource(string? value) => Required(value, 500, "feeReasonOrSource");
    public static string MutationReason(string? value) => Required(value, 1000, "reason");

    public static int RunningNumberWidth(int value)
    {
        if (value is < 1 or > 9)
        {
            throw new NoticeDraftValidationException(
                "runningNumberWidth",
                "Die Stellenzahl muss zwischen 1 und 9 liegen.");
        }

        return value;
    }

    public static string FormatNoticeNumber(
        string financialProduct,
        int year,
        int runningNumber,
        int runningNumberWidth)
    {
        var product = FinancialProduct(financialProduct);
        var width = RunningNumberWidth(runningNumberWidth);
        var maximum = MaximumRunningNumber(width);
        if (runningNumber is < 1 || runningNumber > maximum)
        {
            throw new NoticeNumberSequenceExhaustedException();
        }

        var value = $"{product}.{year:0000}{runningNumber.ToString($"D{width}", System.Globalization.CultureInfo.InvariantCulture)}";
        if (value.Length > 100)
        {
            throw new NoticeDraftValidationException(
                "noticeNumber",
                "Die vollständige Bescheidnummer darf höchstens 100 Zeichen enthalten.");
        }

        return value;
    }

    public static int MaximumRunningNumber(int width)
    {
        RunningNumberWidth(width);
        var value = 1;
        for (var index = 0; index < width; index++)
        {
            value *= 10;
        }

        return value - 1;
    }

    private static string Required(string? value, int maximumLength, string field)
    {
        var clean = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        if (clean is null)
        {
            throw new NoticeDraftValidationException(field, "Der Wert ist erforderlich.");
        }

        if (clean.Length > maximumLength)
        {
            throw new NoticeDraftValidationException(
                field,
                $"Der Wert darf höchstens {maximumLength} Zeichen enthalten.");
        }

        return clean;
    }
}

public sealed class NoticeDraftValidationException(string field, string message) : Exception(message)
{
    public string Field { get; } = field;
}

public sealed class NoticeNumberSequenceExhaustedException()
    : Exception("Die konfigurierte Stellenzahl für die laufende Nummer ist erschöpft.");
