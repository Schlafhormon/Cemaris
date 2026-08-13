using System.Security.Claims;
using System.Threading.RateLimiting;
using Cemaris.Api.Contracts;
using Cemaris.Api.ErrorHandling;
using Cemaris.Api.Security;
using Cemaris.Application.Cases;
using Cemaris.Application.Identity;
using Cemaris.Application.System;
using Cemaris.Domain.Cases;
using Cemaris.Infrastructure;
using Cemaris.Infrastructure.Persistence;
using Cemaris.Infrastructure.ReadModel;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

var caseEditingEnabled = builder.Configuration.GetValue<bool>("Features:CaseEditingEnabled");
if (caseEditingEnabled && !builder.Environment.IsDevelopment())
{
    throw new InvalidOperationException(
        "Case editing may be enabled only in the Development environment with synthetic data.");
}

builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";
    options.UseUtcTimestamp = true;
});

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .GetChildren()
    .Select(origin => origin.Value)
    .OfType<string>()
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .ToArray();

var openApiEnabled = builder.Configuration.GetValue(
    "OpenApi:Enabled",
    builder.Environment.IsDevelopment());

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddHealthChecks();
builder.Services.AddCemarisInfrastructure(builder.Configuration);

var identityOptions = new LocalAccountSecurityOptions();
builder.Configuration.GetSection("Identity:Security").Bind(identityOptions);
identityOptions.Validate();
builder.Services.AddSingleton(identityOptions);
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<IPasswordHasher<LocalAccountSnapshot>, PasswordHasher<LocalAccountSnapshot>>();
builder.Services.AddScoped<LocalAccountService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentActorProvider, HttpCurrentActorProvider>();
builder.Services.AddScoped<LocalCookieAuthenticationEvents>();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "Cemaris.Session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        options.ExpireTimeSpan = identityOptions.SessionIdleTimeout;
        options.SlidingExpiration = true;
        options.EventsType = typeof(LocalCookieAuthenticationEvents);
    });
builder.Services.AddAuthorization(options =>
{
    foreach (var (policyName, roles) in CemarisPolicies.Matrix)
    {
        options.AddPolicy(policyName, policy => policy
            .RequireAuthenticatedUser()
            .RequireRole(roles.Select(item => item.Value))
            .RequireClaim(CemarisClaimTypes.PasswordChangeRequired, bool.FalseString));
    }
});
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-Cemaris-CSRF";
    options.Cookie.Name = "Cemaris.Antiforgery";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("Login", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            QueueLimit = 0,
            Window = TimeSpan.FromMinutes(1),
            AutoReplenishment = true,
        }));
});

var maximumSearchResults = builder.Configuration.GetValue<int?>("Search:MaxResults") ?? 10;
builder.Services.AddScoped(serviceProvider => new CaseReadService(
    serviceProvider.GetRequiredService<ICaseReadStore>(),
    maximumSearchResults));
if (caseEditingEnabled)
{
    builder.Services.AddScoped<CaseWriteService>();
}

if (openApiEnabled)
{
    builder.Services.AddOpenApi(options => options.AddDocumentTransformer((document, _, _) =>
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes["CemarisCookie"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.ApiKey,
            In = ParameterLocation.Cookie,
            Name = "Cemaris.Session",
            Description = "HttpOnly-Sitzungscookie; zustandsändernde Requests benötigen zusätzlich X-Cemaris-CSRF.",
        };
        return Task.CompletedTask;
    }));
}

if (allowedOrigins.Length > 0)
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("CemarisWeb", policy =>
            policy
                .WithOrigins(allowedOrigins)
                .AllowCredentials()
                .AllowAnyHeader()
                .AllowAnyMethod());
    });
}

var app = builder.Build();

if (builder.Configuration.GetValue<bool>("Maintenance:BootstrapAdministrator"))
{
    var readModelProvider = builder.Configuration["ReadModel:Provider"] ?? "Synthetic";
    if (!readModelProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException("Local administrator bootstrap requires the SQL Server provider.");
    }

    var expectedDatabase = builder.Configuration["Maintenance:ExpectedDatabase"];
    if (string.IsNullOrWhiteSpace(expectedDatabase))
    {
        throw new InvalidOperationException(
            "Maintenance:ExpectedDatabase must be set explicitly for local administrator bootstrap.");
    }

    await using var scope = app.Services.CreateAsyncScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<CemarisDbContext>();
    var resolvedDatabase = dbContext.Database.GetDbConnection().Database;
    if (!string.Equals(expectedDatabase, resolvedDatabase, StringComparison.Ordinal))
    {
        throw new InvalidOperationException("The resolved database does not match Maintenance:ExpectedDatabase.");
    }

    if ((await dbContext.Database.GetPendingMigrationsAsync()).Any())
    {
        throw new InvalidOperationException("All migrations must be applied before local administrator bootstrap.");
    }

    var service = scope.ServiceProvider.GetRequiredService<LocalAccountService>();
    var account = await service.BootstrapFirstAdministratorAsync(
        builder.Configuration["Bootstrap:Username"],
        builder.Configuration["Bootstrap:DisplayName"],
        builder.Configuration["Bootstrap:Password"],
        CancellationToken.None);
    SecurityLog.BootstrapCompleted(app.Logger, account.Id);
    return;
}

if (builder.Configuration.GetValue<bool>("Maintenance:SeedSynthetic"))
{
    if (!app.Environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            "Synthetic SQL seeding is permitted only in the Development environment.");
    }

    var readModelProvider = builder.Configuration["ReadModel:Provider"] ?? "Synthetic";
    if (!readModelProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException(
            "Synthetic SQL seeding requires ReadModel:Provider to be 'SqlServer'.");
    }

    var expectedDatabase = builder.Configuration["Maintenance:ExpectedDatabase"];
    if (string.IsNullOrWhiteSpace(expectedDatabase))
    {
        throw new InvalidOperationException(
            "Maintenance:ExpectedDatabase must be set explicitly when synthetic SQL seeding is requested.");
    }

    await using var scope = app.Services.CreateAsyncScope();
    var seeder = scope.ServiceProvider.GetRequiredService<SyntheticReadModelSeeder>();
    var result = await seeder.ResetAsync(expectedDatabase, CancellationToken.None);

    ApiLog.SyntheticSeedCompleted(
        app.Logger,
        result.CasesWritten,
        result.SkippedUnresolvedUsageRightHolders);

    return;
}

app.UseExceptionHandler();
app.UseRateLimiter();

if (openApiEnabled)
{
    app.MapOpenApi();
}

if (allowedOrigins.Length > 0)
{
    app.UseCors("CemarisWeb");
}

app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = static async (context, report) =>
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsJsonAsync(
            new HealthResponse(
                report.Status == HealthStatus.Healthy ? "Healthy" : report.Status.ToString(),
                "Cemaris.Api"),
            context.RequestAborted);
    },
});

var authenticationEndpoints = app.MapGroup("/api/auth")
    .WithTags("Authentication");

authenticationEndpoints.MapGet("/csrf", (IAntiforgery antiforgery, HttpContext context) =>
{
    var tokens = antiforgery.GetAndStoreTokens(context);
    return TypedResults.Ok(new AntiforgeryTokenResponse(
        tokens.RequestToken ?? throw new InvalidOperationException("No antiforgery request token was issued."),
        tokens.HeaderName ?? "X-Cemaris-CSRF"));
})
    .WithName("GetAntiforgeryToken")
    .Produces<AntiforgeryTokenResponse>(StatusCodes.Status200OK);

authenticationEndpoints.MapPost("/login", LoginAsync)
    .WithName("Login")
    .WithDescription("Requires an antiforgery request token in X-Cemaris-CSRF and the antiforgery cookie.")
    .RequireCemarisAntiforgery()
    .RequireRateLimiting("Login")
    .Produces<CurrentAccountResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status429TooManyRequests);

authenticationEndpoints.MapPost("/logout", LogoutAsync)
    .WithName("Logout")
    .RequireAuthorization()
    .RequireCemarisAntiforgery()
    .Produces(StatusCodes.Status204NoContent)
    .ProducesProblem(StatusCodes.Status401Unauthorized);

authenticationEndpoints.MapGet("/me", GetCurrentAccountAsync)
    .WithName("GetCurrentAccount")
    .RequireAuthorization()
    .Produces<CurrentAccountResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status401Unauthorized);

authenticationEndpoints.MapPost("/change-password", ChangeOwnPasswordAsync)
    .WithName("ChangeOwnPassword")
    .RequireAuthorization()
    .RequireCemarisAntiforgery()
    .Produces(StatusCodes.Status204NoContent)
    .ProducesValidationProblem(StatusCodes.Status400BadRequest)
    .ProducesProblem(StatusCodes.Status401Unauthorized);

var accountEndpoints = app.MapGroup("/api/admin/accounts")
    .WithTags("User administration")
    .RequireAuthorization(CemarisPolicies.UserAdministration);

accountEndpoints.MapGet("/", ListAccountsAsync)
    .WithName("ListLocalAccounts")
    .Produces<IReadOnlyList<LocalAccountResponse>>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status403Forbidden);

accountEndpoints.MapPost("/", CreateAccountAsync)
    .WithName("CreateLocalAccount")
    .RequireCemarisAntiforgery()
    .Produces<LocalAccountResponse>(StatusCodes.Status201Created)
    .ProducesValidationProblem(StatusCodes.Status400BadRequest)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status403Forbidden);

accountEndpoints.MapPut("/{accountId:guid}", UpdateAccountAsync)
    .WithName("UpdateLocalAccount")
    .RequireCemarisAntiforgery()
    .Produces<LocalAccountResponse>(StatusCodes.Status200OK)
    .ProducesValidationProblem(StatusCodes.Status400BadRequest)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status403Forbidden)
    .ProducesProblem(StatusCodes.Status409Conflict);

accountEndpoints.MapPut("/{accountId:guid}/active", SetAccountActiveAsync)
    .WithName("SetLocalAccountActive")
    .RequireCemarisAntiforgery()
    .Produces<LocalAccountResponse>(StatusCodes.Status200OK)
    .ProducesValidationProblem(StatusCodes.Status400BadRequest)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status403Forbidden)
    .ProducesProblem(StatusCodes.Status409Conflict);

accountEndpoints.MapPost("/{accountId:guid}/reset-password", ResetAccountPasswordAsync)
    .WithName("ResetLocalAccountPassword")
    .RequireCemarisAntiforgery()
    .Produces<LocalAccountResponse>(StatusCodes.Status200OK)
    .ProducesValidationProblem(StatusCodes.Status400BadRequest)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status403Forbidden)
    .ProducesProblem(StatusCodes.Status409Conflict);

var systemEndpoints = app.MapGroup("/api/system")
    .WithTags("System");

systemEndpoints.MapGet("/info", () =>
{
    var project = ProjectInformation.Current;

    return TypedResults.Ok(new SystemInformationResponse(
        project.Name,
        project.Subtitle,
        project.Phase,
        project.ProductionReady,
        caseEditingEnabled,
        typeof(Program).Assembly.GetName().Version?.ToString(3) ?? "unbekannt"));
})
    .WithName("GetSystemInformation")
    .Produces<SystemInformationResponse>(StatusCodes.Status200OK);

var caseEndpoints = app.MapGroup("/api")
    .WithTags("Read-only cases")
    .RequireAuthorization(CemarisPolicies.CaseWork);

caseEndpoints.MapGet("/search", SearchCasesAsync)
    .WithName("SearchCases")
    .WithSummary("Searches the read-only case overview with AND-combined filters.")
    .Produces<SearchCasesResponse>(StatusCodes.Status200OK)
    .ProducesValidationProblem(StatusCodes.Status400BadRequest)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status403Forbidden);

caseEndpoints.MapGet("/cases/{id:guid}", GetCaseAsync)
    .WithName("GetCase")
    .WithSummary("Returns the complete read-only MVP detail projection for one case.")
    .Produces<CaseResponse>(StatusCodes.Status200OK)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status403Forbidden);

if (caseEditingEnabled)
{
    var writeEndpoints = app.MapGroup("/api/cases")
        .WithTags("Synthetic Development case editing")
        .RequireAuthorization(CemarisPolicies.CaseWork)
        .RequireCemarisAntiforgery();

    writeEndpoints.MapPost("/", CreateCaseAsync)
        .WithName("CreateCase")
        .WithSummary("Creates one synthetic Development case record with a server-generated ID.")
        .WithDescription("Returns Location, the current projection and a strong ETag containing the case version.")
        .Produces<CaseResponse>(StatusCodes.Status201Created)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest);

    writeEndpoints.MapPut("/{caseId:guid}/grave", ChangeGraveAsync)
        .WithName("ChangeCaseGrave")
        .WithSummary("Changes the stored grave reference of a synthetic Development case.")
        .WithDescription("Requires the last strong case ETag in If-Match.")
        .Produces<CaseResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status412PreconditionFailed)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired);

    writeEndpoints.MapPost("/{caseId:guid}/deceased-persons", AddDeceasedPersonAsync)
        .WithName("AddCaseDeceasedPerson")
        .WithSummary("Adds a deceased person with a server-generated ID.")
        .WithDescription("Requires the last strong case ETag in If-Match.")
        .Produces<CaseResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status412PreconditionFailed)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired);

    writeEndpoints.MapPut(
            "/{caseId:guid}/deceased-persons/{personId:guid}",
            ChangeDeceasedPersonAsync)
        .WithName("ChangeCaseDeceasedPerson")
        .WithSummary("Changes a deceased person already stored in the case.")
        .WithDescription("Requires the last strong case ETag in If-Match.")
        .Produces<CaseResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status412PreconditionFailed)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired);

    writeEndpoints.MapPost("/{caseId:guid}/burials", AddBurialAsync)
        .WithName("AddCaseBurial")
        .WithSummary("Adds a burial with a server-generated ID.")
        .WithDescription("Requires the last strong case ETag in If-Match.")
        .Produces<CaseResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status412PreconditionFailed)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired);

    writeEndpoints.MapPut("/{caseId:guid}/burials/{burialId:guid}", ChangeBurialAsync)
        .WithName("ChangeCaseBurial")
        .WithSummary("Changes a burial already stored in the case.")
        .WithDescription("Requires the last strong case ETag in If-Match.")
        .Produces<CaseResponse>(StatusCodes.Status200OK)
        .ProducesValidationProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status412PreconditionFailed)
        .ProducesProblem(StatusCodes.Status428PreconditionRequired);
}

app.Run();

static async Task<IResult> LoginAsync(
    LoginRequest request,
    LocalAccountService service,
    LocalAccountSecurityOptions options,
    HttpContext context,
    ILogger<Program> logger,
    CancellationToken cancellationToken)
{
    var result = await service.AuthenticateAsync(request.Username, request.Password, cancellationToken);
    if (!result.Succeeded || result.Account is null)
    {
        SecurityLog.LoginFailed(logger);
        return Results.Problem(
            statusCode: StatusCodes.Status401Unauthorized,
            title: "Die Anmeldung ist fehlgeschlagen.",
            type: "https://httpstatuses.com/401");
    }

    var account = result.Account;
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, account.Id.ToString("D")),
        new Claim(ClaimTypes.Name, account.DisplayName),
        new Claim(ClaimTypes.Role, account.Role.Value),
        new Claim(CemarisClaimTypes.SecurityStamp, account.SecurityStamp.ToString("D")),
        new Claim(CemarisClaimTypes.PasswordChangeRequired, account.MustChangePassword.ToString()),
    };
    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    await context.SignInAsync(
        CookieAuthenticationDefaults.AuthenticationScheme,
        new ClaimsPrincipal(identity),
        new AuthenticationProperties
        {
            AllowRefresh = true,
            IsPersistent = false,
            IssuedUtc = TimeProvider.System.GetUtcNow(),
            ExpiresUtc = TimeProvider.System.GetUtcNow().Add(options.SessionIdleTimeout),
        });
    SecurityLog.LoginSucceeded(logger, account.Id);
    return Results.Ok(ToCurrentAccount(account));
}

static async Task<IResult> LogoutAsync(
    HttpContext context,
    ILogger<Program> logger)
{
    PrincipalAccount.TryGetId(context.User, out var accountId);
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    SecurityLog.Logout(logger, accountId);
    return Results.NoContent();
}

static async Task<IResult> GetCurrentAccountAsync(
    HttpContext context,
    LocalAccountService service,
    CancellationToken cancellationToken)
{
    if (!PrincipalAccount.TryGetId(context.User, out var accountId))
    {
        return Results.Unauthorized();
    }

    var account = await service.FindByIdAsync(accountId, cancellationToken);
    return account is null || !account.IsActive
        ? Results.Unauthorized()
        : Results.Ok(ToCurrentAccount(account));
}

static async Task<IResult> ChangeOwnPasswordAsync(
    ChangeOwnPasswordRequest request,
    HttpContext context,
    LocalAccountService service,
    ILogger<Program> logger,
    CancellationToken cancellationToken)
{
    if (!PrincipalAccount.TryGetId(context.User, out var accountId))
    {
        return Results.Unauthorized();
    }

    try
    {
        var result = await service.ChangeOwnPasswordAsync(
            accountId,
            request.CurrentPassword,
            request.NewPassword,
            cancellationToken);
        if (result.Status != LocalAccountOperationStatus.Success)
        {
            return ValidationProblem(
                new Dictionary<string, string[]>
                {
                    ["currentPassword"] = ["Das aktuelle Passwort ist nicht korrekt."],
                },
                "Das Passwort konnte nicht geändert werden.");
        }

        await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        SecurityLog.PasswordChanged(logger, accountId);
        return Results.NoContent();
    }
    catch (LocalAccountValidationException exception)
    {
        return ValidationProblem(exception.Errors, exception.Message);
    }
}

static async Task<IResult> ListAccountsAsync(
    LocalAccountService service,
    CancellationToken cancellationToken)
{
    var accounts = await service.ListAsync(cancellationToken);
    return Results.Ok(accounts.Select(LocalAccountResponse.From).ToArray());
}

static async Task<IResult> CreateAccountAsync(
    CreateLocalAccountRequest request,
    HttpContext context,
    LocalAccountService service,
    ILogger<Program> logger,
    CancellationToken cancellationToken)
{
    if (!PrincipalAccount.TryGetId(context.User, out var actorId))
    {
        return Results.Unauthorized();
    }

    try
    {
        var account = await service.CreateAsync(
            new CreateLocalAccountCommand(
                request.Username,
                request.DisplayName,
                request.Role,
                request.Password),
            cancellationToken);
        SecurityLog.AdministrationOperation(
            logger,
            actorId,
            account.Id,
            "Create",
            LocalAccountOperationStatus.Success);
        return Results.Created($"/api/admin/accounts/{account.Id}", LocalAccountResponse.From(account));
    }
    catch (LocalAccountValidationException exception)
    {
        SecurityLog.AdministrationOperation(
            logger,
            actorId,
            Guid.Empty,
            "Create",
            LocalAccountOperationStatus.ValidationFailed);
        return ValidationProblem(exception.Errors, exception.Message);
    }
}

static async Task<IResult> UpdateAccountAsync(
    Guid accountId,
    UpdateLocalAccountRequest request,
    HttpContext context,
    LocalAccountService service,
    ILogger<Program> logger,
    CancellationToken cancellationToken)
{
    if (!PrincipalAccount.TryGetId(context.User, out var actorId))
    {
        return Results.Unauthorized();
    }

    if (!LocalAccountVersion.TryDecode(request.Version, out var version))
    {
        return InvalidAccountVersion(logger, actorId, accountId, "Update");
    }

    try
    {
        var result = await service.UpdateAsync(
            actorId,
            accountId,
            new UpdateLocalAccountCommand(request.Username, request.DisplayName, request.Role, version),
            cancellationToken);
        return AccountMutationResponse(result, actorId, accountId, "Update", logger);
    }
    catch (LocalAccountValidationException exception)
    {
        SecurityLog.AdministrationOperation(
            logger,
            actorId,
            accountId,
            "Update",
            LocalAccountOperationStatus.ValidationFailed);
        return ValidationProblem(exception.Errors, exception.Message);
    }
}

static async Task<IResult> SetAccountActiveAsync(
    Guid accountId,
    SetLocalAccountActiveRequest request,
    HttpContext context,
    LocalAccountService service,
    ILogger<Program> logger,
    CancellationToken cancellationToken)
{
    if (!PrincipalAccount.TryGetId(context.User, out var actorId))
    {
        return Results.Unauthorized();
    }

    if (!LocalAccountVersion.TryDecode(request.Version, out var version))
    {
        return InvalidAccountVersion(
            logger,
            actorId,
            accountId,
            request.IsActive ? "Activate" : "Deactivate");
    }

    var result = await service.SetActiveAsync(
        actorId,
        accountId,
        version,
        request.IsActive,
        cancellationToken);
    return AccountMutationResponse(
        result,
        actorId,
        accountId,
        request.IsActive ? "Activate" : "Deactivate",
        logger);
}

static async Task<IResult> ResetAccountPasswordAsync(
    Guid accountId,
    ResetLocalAccountPasswordRequest request,
    HttpContext context,
    LocalAccountService service,
    ILogger<Program> logger,
    CancellationToken cancellationToken)
{
    if (!PrincipalAccount.TryGetId(context.User, out var actorId))
    {
        return Results.Unauthorized();
    }

    if (!LocalAccountVersion.TryDecode(request.Version, out var version))
    {
        return InvalidAccountVersion(logger, actorId, accountId, "ResetPassword");
    }

    try
    {
        var result = await service.ResetPasswordAsync(
            accountId,
            version,
            request.TemporaryPassword,
            cancellationToken);
        return AccountMutationResponse(result, actorId, accountId, "ResetPassword", logger);
    }
    catch (LocalAccountValidationException exception)
    {
        SecurityLog.AdministrationOperation(
            logger,
            actorId,
            accountId,
            "ResetPassword",
            LocalAccountOperationStatus.ValidationFailed);
        return ValidationProblem(exception.Errors, exception.Message);
    }
}

static IResult AccountMutationResponse(
    LocalAccountOperationResult result,
    Guid actorId,
    Guid accountId,
    string operation,
    ILogger logger)
{
    SecurityLog.AdministrationOperation(logger, actorId, accountId, operation, result.Status);
    return result.Status switch
    {
        LocalAccountOperationStatus.Success when result.Account is not null =>
            Results.Ok(LocalAccountResponse.From(result.Account)),
        LocalAccountOperationStatus.NotFound => Results.NotFound(),
        LocalAccountOperationStatus.ConcurrencyConflict => Results.Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: "Das Konto wurde zwischenzeitlich geändert."),
        LocalAccountOperationStatus.LastActiveAdministrator => Results.Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: "Der letzte aktive Administrator muss erhalten bleiben."),
        LocalAccountOperationStatus.SelfDeactivation => Results.Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: "Das eigene aktive Konto kann nicht deaktiviert werden."),
        _ => Results.Problem(
            statusCode: StatusCodes.Status409Conflict,
            title: "Die Kontoänderung konnte nicht ausgeführt werden."),
    };
}

static IResult InvalidAccountVersion(
    ILogger logger,
    Guid actorId,
    Guid accountId,
    string operation)
{
    SecurityLog.AdministrationOperation(
        logger,
        actorId,
        accountId,
        operation,
        LocalAccountOperationStatus.ValidationFailed);
    return ValidationProblem(
        new Dictionary<string, string[]>
        {
            ["version"] = ["Eine gültige Kontoversion ist erforderlich."],
        },
        "Die Kontoversion ist ungültig.");
}

static CurrentAccountResponse ToCurrentAccount(LocalAccountSnapshot account) => new(
    account.Id,
    account.Username,
    account.DisplayName,
    account.Role.Value,
    account.MustChangePassword);

static async Task<IResult> SearchCasesAsync(
    [AsParameters] SearchCasesRequest request,
    CaseReadService service,
    CancellationToken cancellationToken)
{
    try
    {
        var response = await service.SearchAsync(request.ToCriteria(), cancellationToken);
        return Results.Ok(response.ToResponse());
    }
    catch (SearchValidationException exception)
    {
        return Results.ValidationProblem(
            exception.Errors.ToDictionary(item => item.Key, item => item.Value),
            title: exception.Message,
            statusCode: StatusCodes.Status400BadRequest);
    }
}

static async Task<IResult> GetCaseAsync(
    Guid id,
    CaseReadService service,
    HttpResponse response,
    CancellationToken cancellationToken)
{
    var caseOverview = await service.GetAsync(id, cancellationToken);
    if (caseOverview is not null)
    {
        SetCaseEtag(response, caseOverview.Version);
        return Results.Ok(caseOverview.ToResponse());
    }

    return Results.Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Der angeforderte Fall wurde nicht gefunden.",
        type: "https://httpstatuses.com/404");
}

static async Task<IResult> CreateCaseAsync(
    CreateCaseRequest request,
    CaseWriteService service,
    HttpResponse response,
    CancellationToken cancellationToken)
{
    try
    {
        var created = await service.CreateAsync(request.ToCommand(), cancellationToken);
        SetCaseEtag(response, created.Version);
        return Results.Created($"/api/cases/{created.Id}", created.ToResponse());
    }
    catch (CaseValidationException exception)
    {
        return ValidationProblem(exception.Errors, exception.Message);
    }
}

static Task<IResult> ChangeGraveAsync(
    Guid caseId,
    ChangeGraveRequest request,
    CaseWriteService service,
    HttpContext context,
    CancellationToken cancellationToken) =>
    ExecuteMutationAsync(
        context,
        expectedVersion => service.ChangeGraveAsync(
            caseId,
            expectedVersion,
            request.ToCommand(),
            cancellationToken));

static Task<IResult> AddDeceasedPersonAsync(
    Guid caseId,
    SaveDeceasedPersonRequest request,
    CaseWriteService service,
    HttpContext context,
    CancellationToken cancellationToken) =>
    ExecuteMutationAsync(
        context,
        expectedVersion => service.AddDeceasedPersonAsync(
            caseId,
            expectedVersion,
            request.ToCommand(),
            cancellationToken));

static Task<IResult> ChangeDeceasedPersonAsync(
    Guid caseId,
    Guid personId,
    SaveDeceasedPersonRequest request,
    CaseWriteService service,
    HttpContext context,
    CancellationToken cancellationToken) =>
    ExecuteMutationAsync(
        context,
        expectedVersion => service.ChangeDeceasedPersonAsync(
            caseId,
            personId,
            expectedVersion,
            request.ToCommand(),
            cancellationToken));

static Task<IResult> AddBurialAsync(
    Guid caseId,
    SaveBurialRequest request,
    CaseWriteService service,
    HttpContext context,
    CancellationToken cancellationToken) =>
    ExecuteMutationAsync(
        context,
        expectedVersion => service.AddBurialAsync(
            caseId,
            expectedVersion,
            request.ToCommand(),
            cancellationToken));

static Task<IResult> ChangeBurialAsync(
    Guid caseId,
    Guid burialId,
    SaveBurialRequest request,
    CaseWriteService service,
    HttpContext context,
    CancellationToken cancellationToken) =>
    ExecuteMutationAsync(
        context,
        expectedVersion => service.ChangeBurialAsync(
            caseId,
            burialId,
            expectedVersion,
            request.ToCommand(),
            cancellationToken));

static async Task<IResult> ExecuteMutationAsync(
    HttpContext context,
    Func<long, Task<CaseOverview>> mutation)
{
    var preconditionProblem = ParseExpectedVersion(context.Request, out var expectedVersion);
    if (preconditionProblem is not null)
    {
        return preconditionProblem;
    }

    try
    {
        var updated = await mutation(expectedVersion);
        SetCaseEtag(context.Response, updated.Version);
        return Results.Ok(updated.ToResponse());
    }
    catch (CaseValidationException exception)
    {
        return ValidationProblem(exception.Errors, exception.Message);
    }
    catch (CaseReferenceValidationException exception)
    {
        return ValidationProblem(exception.Errors, exception.Message);
    }
    catch (CaseRecordNotFoundException exception)
    {
        return NotFoundProblem(exception.Message);
    }
    catch (CaseChildNotFoundException exception)
    {
        return NotFoundProblem(exception.Message);
    }
    catch (CaseVersionConflictException exception)
    {
        return Results.Problem(
            statusCode: StatusCodes.Status412PreconditionFailed,
            title: exception.Message,
            type: "https://httpstatuses.com/412");
    }
}

static IResult? ParseExpectedVersion(HttpRequest request, out long expectedVersion)
{
    expectedVersion = 0;
    if (!request.Headers.TryGetValue("If-Match", out var values))
    {
        return Results.Problem(
            statusCode: StatusCodes.Status428PreconditionRequired,
            title: "Für diese Änderung ist der zuletzt gelesene ETag in If-Match erforderlich.",
            type: "https://httpstatuses.com/428");
    }

    if (values.Count != 1)
    {
        return InvalidEtagProblem();
    }

    var value = values[0];
    if (value is null
        || value.Length < 3
        || value[0] != '"'
        || value[^1] != '"'
        || !long.TryParse(
            value.AsSpan(1, value.Length - 2),
            System.Globalization.NumberStyles.None,
            System.Globalization.CultureInfo.InvariantCulture,
            out expectedVersion)
        || expectedVersion < 1)
    {
        return InvalidEtagProblem();
    }

    return null;
}

static IResult InvalidEtagProblem() =>
    Results.Problem(
        statusCode: StatusCodes.Status400BadRequest,
        title: "If-Match muss genau einen starken Fallversions-ETag wie \"1\" enthalten.",
        type: "https://httpstatuses.com/400");

static IResult ValidationProblem(
    IReadOnlyDictionary<string, string[]> errors,
    string title) =>
    Results.ValidationProblem(
        errors.ToDictionary(item => item.Key, item => item.Value),
        title: title,
        statusCode: StatusCodes.Status400BadRequest);

static IResult NotFoundProblem(string title) =>
    Results.Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: title,
        type: "https://httpstatuses.com/404");

static void SetCaseEtag(HttpResponse response, long version) =>
    response.Headers.ETag = $"\"{version.ToString(System.Globalization.CultureInfo.InvariantCulture)}\"";

public partial class Program;

internal static partial class ApiLog
{
    [LoggerMessage(
        EventId = 1001,
        Level = LogLevel.Information,
        Message = "Synthetic SQL seed completed. Cases written: {casesWritten}; unresolved holder references skipped: {skippedReferences}.")]
    internal static partial void SyntheticSeedCompleted(
        ILogger logger,
        int casesWritten,
        int skippedReferences);
}
