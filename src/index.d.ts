/* eslint-disable @typescript-eslint/no-explicit-any */

declare module '@sqlite.org/sqlite-wasm' {
    // Configuration interface for initializing SQLite
    interface SqliteConfig {
        // Callback function called when SQLite is ready
        onready: () => void;
        // Optional debug logging
        debug?: boolean;
        // Optional path to load SQLite WASM file
        wasmPath?: string;
        // Optional memory configuration
        memory?: {
            initial?: number;
            maximum?: number;
        };
    }

    interface OpenResult {
        result: {
            dbId: string;
            filename: string;
            persistent?: boolean;
            vfs?: string;
        };
    }

    // Result types for different operations
    interface ExecResult {
        rowCount: number;
        columnNames: string[];
        rows: any[][];
    }

    interface PrepareResult {
        sql: string;
        columnNames: string[];
        columnCount: number;
    }

    interface ErrorResult {
        error: {
            message: string;
            code: number;
            errno?: number;
        };
    }

    // Command parameters for different operations
    interface OpenParams {
        filename: string;
        vfs?: string;
        flags?: string;
    }

    interface ExecParams {
        sql: string;
        bind?: any[];
        rowMode?: 'array' | 'object';
        resultRowMode?: 'array' | 'object';
    }

    interface PrepareParams {
        sql: string;
        bind?: any[];
    }

    interface CloseParams {
        dbId: string;
    }

    // All possible SQLite commands
    type SqliteCommand =
        | 'open'
        | 'close'
        | 'exec'
        | 'prepare'
        | 'step'
        | 'finalize'
        | 'export'
        | 'import'
        | 'begin'
        | 'commit'
        | 'rollback';

    // The main SQLite interface that handles commands
    interface SqlitePromiser {
        // Overload for 'open' command
        (command: 'open', params: OpenParams): Promise<OpenResult>;
        // Overload for 'exec' command
        (command: 'exec', params: ExecParams): Promise<ExecResult>;
        // Overload for 'prepare' command
        (command: 'prepare', params: PrepareParams): Promise<PrepareResult>;
        // Overload for 'close' command
        (command: 'close', params: CloseParams): Promise<void>;
        // Generic overload for other commands
        <T = any>(command: SqliteCommand, params: any): Promise<T>;

        // Utility methods
        close(): Promise<void>;
        terminate(): void;
    }

    // Database handle interface
    interface Database {
        dbId: string | undefined;
        filename: string;
        // Add methods that operate on an open database
        exec(sql: string, params?: any[]): Promise<ExecResult>;
        prepare(sql: string): Promise<PrepareResult>;
        close(): Promise<void>;
    }

    // Export the main function that initializes SQLite
    export function sqlite3Worker1Promiser(config: SqliteConfig): SqlitePromiser;

    // Export utility functions
    export function isWorker(): boolean;
    export function initWorker(config: SqliteConfig): Promise<void>;
    export const version: string;
}
