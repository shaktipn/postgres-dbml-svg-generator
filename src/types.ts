export interface DBConfiguration {
    host: string;
    port: number;
    database: string;
    schema: string;
    user: string;
    password: string;
}

export interface ColumnInfo {
    columnName: string;
    dataType: string;
    isNullable: string;
    default: string | null;
}

export interface ForeignKeyInfo {
    tableName: string;
    columnName: string;
    foreignTableName: string;
    foreignColumnName: string;
}
