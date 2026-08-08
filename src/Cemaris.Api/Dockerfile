# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

COPY Directory.Build.props Directory.Packages.props global.json ./
COPY src/Cemaris.Domain/Cemaris.Domain.csproj src/Cemaris.Domain/
COPY src/Cemaris.Application/Cemaris.Application.csproj src/Cemaris.Application/
COPY src/Cemaris.Infrastructure/Cemaris.Infrastructure.csproj src/Cemaris.Infrastructure/
COPY src/Cemaris.Api/Cemaris.Api.csproj src/Cemaris.Api/
RUN dotnet restore src/Cemaris.Api/Cemaris.Api.csproj

COPY src/ src/
RUN dotnet publish src/Cemaris.Api/Cemaris.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "Cemaris.Api.dll"]
