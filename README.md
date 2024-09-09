# PostgreSQL DBML and SVG Generator

This `GitHub` Action generates DBML and SVG files for a PostgreSQL database migrated schema.

## How To Use

Create a workflow for your target repo at `./github/workflows`.
Add the following step to the workflow:

```yaml
- name: Generate DBML and SVG # name of the step
  uses: shaktipn(change to gps)/postgres-dbml-svg-generator@main
  with:
      DB_HOST: <<DB host>>
      DB_PORT: <<DB port>> # has default for 5432
      DB_NAME: <<DB name>>
      DB_SCHEMA_NAME: <<DB schema name>> # has default for public
      DB_USERNAME: <<Username>>
      DB_PASSWORD: <<password>>
      DBML_OUTPUT_LOCATION: <<full path to the location where you want to save the dbml and svg file>>
```

## Inputs

-   `DB_HOST`: The hostname or IP address of the PostgreSQL instance (required)
-   `DB_PORT`: The port number of the PostgreSQL instance (default: 5432)
-   `DB_NAME`: The name of the PostgreSQL database (required)
-   `DB_SCHEMA_NAME`: The name of the PostgreSQL schema (default: public)
-   `DB_USERNAME`: The username for the PostgreSQL user. (required)
-   `DB_PASSWORD`: The password for the PostgreSQL user. (required)
-   `DBML_OUTPUT_LOCATION`: Location for DBML and SVG generation. (required)

## Outputs

No output but following files will be generated:

-   A DBML file as per the specified `DBML_OUTPUT_LOCATION`.
-   A corresponding SVG file at the same location as the DBML file.

# Example Usage:

```yaml
name: Generate DBML and SVG

on:
    push:
        paths:
            - 'path-to-database-migrations/*'

jobs:
    generate-dbml-svg:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - name: Install dependencies
              run: npm ci
            - name: Flyway migrate
              run: ./gradlew -Dflyway.configFiles=postgresql/flyway/local.conf flywayMigrate -i
            - name: Generate DBML and SVG files
              uses: shaktipn/postgres-dbml-svg-generator@main
              with:
                  DB_HOST: ${{ DB_HOST }}
                  DB_PORT: ${{ DB_PORT }}
                  DB_NAME: ${{ DB_NAME }}
                  DB_SCHEMA_NAME: ${{ DB_SCHEMA_NAME }}
                  DB_USERNAME: ${{ DB_USERNAME }}
                  DB_PASSWORD: ${{ DB_PASSWORD }}
                  DBML_OUTPUT_LOCATION: './database_public_schema.dbml'
            - name: Commit Changes
              uses: EndBug/add-and-commit@v9
              with:
                  message: 'Generate DBML file and SVG diagram for Postgres DB migrations'
                  token: ${{ secrets.CUSTOM_GH_TOKEN }}
```
