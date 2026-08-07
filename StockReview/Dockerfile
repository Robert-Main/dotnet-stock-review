# ---- Build stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore with the project file first (better layer caching)
COPY PokemonReview.csproj .
RUN dotnet restore

# Copy the rest of the source and publish
COPY . .
RUN dotnet publish -c Release -o /app/out --no-restore

# ---- Runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Copy the published application from the build stage
COPY --from=build /app/out .

EXPOSE 8080

# sh -c so $PORT (set by Render) is expanded at container start;
# falls back to 8080 when run outside Render.
CMD ["sh", "-c", "dotnet PokemonReview.dll --urls http://+:${PORT:-8080}"]
