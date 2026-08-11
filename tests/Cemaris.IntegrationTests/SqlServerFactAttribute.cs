namespace Cemaris.IntegrationTests;

[AttributeUsage(AttributeTargets.Method)]
internal sealed class SqlServerFactAttribute : FactAttribute
{
    internal const string ConnectionStringEnvironmentVariable =
        "CEMARIS_SQL_TEST_CONNECTION_STRING";

    public SqlServerFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(
            Environment.GetEnvironmentVariable(ConnectionStringEnvironmentVariable)))
        {
            Skip = $"Set {ConnectionStringEnvironmentVariable} to run SQL Server integration tests.";
        }
    }
}
