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
      DBML_OUTPUT_LOCATION: <<full path to the location where you want to save the dbml file>>
      SVG_OUTPUT_LOCATION: <<full path to the location where you want to save the svg file>>
```

## Inputs

-   `DB_HOST`: The hostname or IP address of the PostgreSQL instance (required)
-   `DB_PORT`: The port number of the PostgreSQL instance (default: 5432)
-   `DB_NAME`: The name of the PostgreSQL database (required)
-   `DB_SCHEMA_NAME`: The name of the PostgreSQL schema (default: public)
-   `DB_USERNAME`: The username for the PostgreSQL user. (required)
-   `DB_PASSWORD`: The password for the PostgreSQL user. (required)
-   `DBML_OUTPUT_LOCATION`: Location for DBML generation. (required)
-   `SVG_OUTPUT_LOCATION`: Location for SVG generation. (required)

## Outputs

No output but following files will be generated:

-   A DBML file as per the specified `DBML_OUTPUT_LOCATION`.
-   A SVG file as per the specified `SVG_OUTPUT_LOCATION`.

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

        services:
            postgres:
                image: postgres:15
                env:
                    POSTGRES_DB: playground
                    POSTGRES_USER: playground
                    POSTGRES_PASSWORD: Playground@1234
                options: >-
                    --health-cmd pg_isready
                    --health-interval 10s
                    --health-timeout 5s
                    --health-retries 5
                ports:
                    - 54322:5432

        steps:
            - uses: actions/checkout@v4
            - name: Flyway migrate
              run: ./gradlew -Dflyway.configFiles=postgresql/flyway/local.conf flywayMigrate -i
            - name: Generate DBML and SVG files
              uses: shaktipn/postgres-dbml-svg-generator@main
              with:
                  DB_HOST: localhost
                  DB_PORT: 54322
                  DB_NAME: playground
                  DB_SCHEMA_NAME: public
                  DB_USERNAME: playground
                  DB_PASSWORD: Playground@1234
                  DBML_OUTPUT_LOCATION: './database_public_schema.dbml'
                  SVG_OUTPUT_LOCATION: './database_public_schema.svg'
            - name: Commit Changes
              uses: stefanzweifel/git-auto-commit-action@v5
              with:
                  commit_message: Generate DBML file and SVG diagram
                  file_pattern: ./database_public_schema.dbml ./database_public_schema.svg
```
