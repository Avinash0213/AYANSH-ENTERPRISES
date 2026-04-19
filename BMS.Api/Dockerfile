# Use SDK image to build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY ["BMS.Api.csproj", "./"]
RUN dotnet restore "./BMS.Api.csproj"

# Copy everything else and build
COPY . .
RUN dotnet build "BMS.Api.csproj" -c Release -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "BMS.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BMS.Api.dll"]
