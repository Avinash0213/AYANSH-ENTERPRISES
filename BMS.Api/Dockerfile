# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY ["BMS.Api.csproj", "./"]
RUN dotnet restore "BMS.Api.csproj"

# Copy everything else and build the application
COPY . .
RUN dotnet build "BMS.Api.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "BMS.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app

# Install cultures and icu for .NET globalization support (required for alpine)
RUN apk add --no-cache icu-libs
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BMS.Api.dll"]
