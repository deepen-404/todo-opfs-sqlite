import { OpenResult, sqlite3Worker1Promiser, type SqlitePromiser } from '@sqlite.org/sqlite-wasm';

// Replace the generic Promiser type with the specific SqlitePromiser interface
let dbPromise: Promise<SqlitePromiser> | null = null;
let dbId: string | undefined = undefined;

interface Todo {
    id: number;
    text: string;
    completed: boolean;
    deleted: boolean;
}

interface TableInfoRow {
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
}

async function createInitialSchema(promiser: SqlitePromiser) {
    await promiser('exec', {
        sql: `
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT 0
      )
    `,
        dbId,
    });
}

async function migrateDatabase(promiser: SqlitePromiser) {
    try {
        const tableInfo = await promiser('exec', {
            sql: 'PRAGMA table_info(todos)',
            rowMode: 'object',
            dbId,
        });

        const deletedColumnExists = tableInfo.result.resultRows.some((row: TableInfoRow) => row.name === 'deleted');

        if (!deletedColumnExists) {
            await promiser('exec', {
                sql: 'ALTER TABLE todos ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT 0',
                dbId,
            });
            console.log('Migration completed: Added deleted column to todos table');
        } else {
            console.log('Migration not needed: deleted column already exists');
        }
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

export async function initDb(): Promise<SqlitePromiser> {
    if (dbPromise) return dbPromise;

    dbPromise = (async () => {
        try {
            console.log('Loading and initializing SQLite3 module...');

            // Properly type the sqlite3Worker1Promiser
            const promiser = await new Promise<SqlitePromiser>((resolve) => {
                const _promiser = sqlite3Worker1Promiser({
                    onready: () => resolve(_promiser),
                });
            });

            console.log('Done initializing. Opening database...');

            // Type the openResponse
            let openResponse: OpenResult;

            try {
                openResponse = await promiser('open', {
                    filename: 'file:todo.sqlite3?vfs=opfs',
                });
                console.log('OPFS database opened:', openResponse.result.filename);
            } catch (opfsError) {
                console.warn('OPFS is not available, falling back to in-memory database:', opfsError);
                openResponse = await promiser('open', {
                    filename: ':memory:',
                });
                console.log('In-memory database opened');
            }

            if (!openResponse.result.dbId) {
                throw new Error('Failed to get database ID after opening');
            }

            dbId = openResponse.result.dbId;

            // create schema
            await createInitialSchema(promiser);

            // migration
            await migrateDatabase(promiser);

            console.log('Database initialized and migrated successfully');
            return promiser;
        } catch (err) {
            console.error('Failed to initialize or migrate database:', err);
            throw err;
        }
    })();

    return dbPromise;
}

export async function addTodo(text: string): Promise<void> {
    const promiser = await initDb();
    try {
        await promiser('exec', {
            sql: 'INSERT INTO todos (text) VALUES (?)',
            bind: [text],
            dbId,
        });
        console.log('Todo added successfully');
    } catch (error) {
        console.error('Failed to add todo:', error);
    }
}

export async function getTodos(): Promise<Todo[]> {
    const promiser = await initDb();
    const result = await promiser('exec', {
        sql: 'SELECT * FROM todos WHERE deleted = 0 ORDER BY id DESC',
        rowMode: 'object',
        dbId,
    });

    return result.result.resultRows || [];
}

export async function toggleTodo(id: number): Promise<void> {
    const promiser = await initDb();
    await promiser('exec', {
        sql: 'UPDATE todos SET completed = NOT completed WHERE id = ?',
        bind: [id],
        dbId,
    });
}

export async function updateTodo(id: number, text: string): Promise<void> {
    const promiser = await initDb();
    try {
        await promiser('exec', {
            sql: 'UPDATE todos SET text = ? WHERE id = ?',
            bind: [text, id],
            dbId,
        });
        console.log('Todo updated successfully');
    } catch (error) {
        console.error('Failed to update todo:', error);
        throw error;
    }
}

export async function deleteTodo(id: number): Promise<void> {
    const promiser = await initDb();
    try {
        await promiser('exec', {
            sql: 'UPDATE todos SET deleted = 1 WHERE id = ?',
            bind: [id],
            dbId,
        });
        console.log('Todo marked as deleted successfully');
    } catch (error) {
        console.error('Failed to mark todo as deleted:', error);
        throw error;
    }
}
