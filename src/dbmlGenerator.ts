import { writeFile } from 'fs/promises';
import { ColumnInfo, DBConfiguration, ForeignKeyInfo } from './types';
import { logger } from './logger';
import path from 'path';
import { Client } from 'pg';

/**
 * Generates a DBML file based on the database configuration.
 * @param config The database configuration which is to be used to get the details of the relevant schema to generate the DBML.
 * @param outputLocation The full path to where the DMBL is to be generated.
 */
export async function generateDbml(config: DBConfiguration, outputLocation: string): Promise<void> {
    const client = new Client({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password
    });
    try {
        logger.info('Attempting to connect to database...');
        await client.connect();
        const tables = await getTables(client, config.schema);
        logger.warn(tables.toString()); // debug
        let dbmlContent = "Project {\n  database_type: 'PostgreSQL'\n}\n\n";

        for (const table of tables) {
            const columns = await getColumns(client, config.schema, table);
            //debug
            columns.map((col) => {
                logger.warn(
                    `${col.columnName} | ${col.dataType} | ${col.isNullable} | ${col.default}`
                );
            });
            const primaryKeys = await getPrimaryKeys(client, config.schema, table);
            logger.warn(primaryKeys.toString()); //debug
            dbmlContent += generateTableDbml(table, columns, primaryKeys);
        }
        const foreignKeys = await getForeignKeys(client, config.schema);
        dbmlContent += generateForeignKeyDbml(foreignKeys);
        dbmlContent = dbmlContent.trim();
        await writeFile(outputLocation, dbmlContent.trim());
        logger.info(dbmlContent); //debug
        logger.info(`DBML content has been written to file: ${path.resolve(outputLocation)}`);
    } catch (error) {
        logger.error(`Error during DBML file generation: ${error}`);
        throw new Error('Failed to generate DBML file.');
    } finally {
        await client.end();
        logger.info('Database connection is now closed.');
    }
}

async function getTables(client: Client, schema: string): Promise<string[]> {
    const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = $1 AND table_type = 'BASE TABLE';
  `;
    const result = await client.query(query, [schema]);
    return result.rows.map((row) => row.table_name);
}

async function getColumns(client: Client, schema: string, table: string): Promise<ColumnInfo[]> {
    const query = `
    SELECT column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position;
  `;
    const result = await client.query(query, [schema, table]);
    return result.rows.map((row) => ({
        columnName: row.column_name,
        dataType: mapDataType(
            row.data_type,
            row.character_maximum_length,
            row.numeric_precision,
            row.numeric_scale
        ),
        isNullable: row.is_nullable,
        default: row.column_default
    }));
}

async function getPrimaryKeys(client: Client, schema: string, table: string): Promise<string[]> {
    const query = `
    SELECT c.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage AS ccu
    USING (constraint_schema, constraint_name)
    JOIN information_schema.columns AS c
    ON c.table_schema = tc.constraint_schema
      AND tc.table_name = c.table_name
      AND ccu.column_name = c.column_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = $1
    AND tc.table_name = $2;
  `;
    const result = await client.query(query, [schema, table]);
    return result.rows.map((row) => row.column_name);
}

async function getForeignKeys(client: Client, schema: string): Promise<ForeignKeyInfo[]> {
    const query = `
     SELECT DISTINCT
      kcu.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.columns AS c
      ON c.table_schema = tc.table_schema
      AND c.table_name = kcu.table_name
      AND c.column_name = kcu.column_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = $1
    ORDER BY kcu.table_name, kcu.column_name;
  `;
    const result = await client.query(query, [schema]);
    return result.rows.map((row) => ({
        tableName: row.table_name,
        columnName: row.column_name,
        foreignTableName: row.foreign_table_name,
        foreignColumnName: row.foreign_column_name
    }));
}

function generateTableDbml(table: string, columns: ColumnInfo[], primaryKeys: string[]): string {
    let dbml = `Table ${table} {\n`;
    for (const column of columns) {
        let columnDef = `  ${column.columnName} ${column.dataType}`;
        const constraints = [];
        if (column.isNullable === 'NO') {
            constraints.push('not null');
        }
        if (column.default) {
            constraints.push(`default: \`${column.default}\``);
        }
        if (constraints.length > 0) {
            columnDef += ` [${constraints.join(', ')}]`;
        }
        dbml += columnDef + '\n';
    }
    if (primaryKeys.length > 0) {
        dbml += `\n  indexes {\n    (${primaryKeys.join(', ')}) [pk]\n  }\n`;
    }
    dbml += '}\n\n';
    return dbml;
}

function generateForeignKeyDbml(foreignKeys: ForeignKeyInfo[]): string {
    return foreignKeys
        .map(
            (fk) =>
                `Ref: ${fk.tableName}.${fk.columnName} > ${fk.foreignTableName}.${fk.foreignColumnName}\n`
        )
        .join('');
}

function mapDataType(
    postgresType: string,
    maxLength: number,
    precision: number,
    scale: number
): string {
    switch (postgresType.toLowerCase()) {
        case 'smallint':
        case 'integer':
        case 'bigint':
            return 'integer';

        case 'numeric':
        case 'decimal':
            return precision && scale
                ? `decimal(${precision},${scale})`
                : precision
                ? `decimal(${precision})`
                : 'decimal';

        case 'real':
        case 'float4':
        case 'double precision':
        case 'float8':
            return 'float';

        case 'character':
        case 'character varying':
        case 'varchar':
            return maxLength ? `varchar(${maxLength})` : 'varchar';

        case 'text':
            return 'text';

        case 'timestamp':
        case 'timestamp without time zone':
            return 'timestamp';

        case 'timestamp with time zone':
            return 'timestamptz';

        case 'date':
            return 'date';

        case 'time':
        case 'time without time zone':
            return 'time';
        case 'time with time zone':
            return 'timetz';

        case 'boolean':
            return 'boolean';

        case 'json':
        case 'jsonb':
            return 'json';

        case 'bytea':
            return 'binary';

        case 'uuid':
            return 'uuid';

        case 'cidr':
        case 'inet':
        case 'macaddr':
            return 'inet';

        case 'money':
            return 'money';

        case 'xml':
            return 'xml';

        case 'int4range':
        case 'int8range':
        case 'numrange':
        case 'tsrange':
        case 'tstzrange':
        case 'daterange':
            return 'range';

        case 'serial':
        case 'bigserial':
            return 'serial';

        default:
            return `"${postgresType}"`;
    }
}
