import consola from 'consola';
import sql from 'mssql';
import type { MssqlConfig as LocalMssqlConfig } from './config';

const logger = consola.withTag('mssql-connection');

export interface ConnectionPool {
	query<T = any>(sqlQuery: string): Promise<T[]>;
	queryWithTransaction<T = any>(sqlQuery: string, readOnly?: boolean): Promise<T[]>;
	close(): Promise<void>;
}

/**
 * Create a connection pool using the mssql package
 */
export function createConnectionPool(config: LocalMssqlConfig): ConnectionPool {
	const mssqlConfig: sql.config = {
		server: config.server,
		database: config.database,
		port: config.port,
		pool: {
			max: 10,
			min: 0,
			idleTimeoutMillis: 30000,
		},
		options: {
			encrypt: config.encrypt,
			trustServerCertificate: !config.encrypt, // Only trust server cert if not encrypting
		},
	};

	// Configure authentication based on Windows Auth setting
	if (config.windowsAuth) {
		// Windows Authentication - use integrated security
		mssqlConfig.options!.trustedConnection = true;
		logger.info('Configured for Windows Authentication');
	} else {
		// SQL Server Authentication - use username and password
		if (!config.user || !config.password) {
			throw new Error('Username and password are required for SQL authentication');
		}
		mssqlConfig.user = config.user;
		mssqlConfig.password = config.password;
		logger.info(`Configured for SQL Authentication as user: ${config.user}`);
	}

	const pool = new sql.ConnectionPool(mssqlConfig);
	let isConnected = false;

	// Log read-only mode configuration
	if (config.accessMode === 'readonly') {
		logger.info('Connection configured for read-only access mode');
	}

	return {
		async query<T = any>(sqlQuery: string): Promise<T[]> {
			if (!isConnected) {
				await pool.connect();
				isConnected = true;
				logger.debug('Connection pool connected');
			}

			try {
				const result = await pool.request().query(sqlQuery);
				return result.recordset as T[];
			} catch (error) {
				logger.error('Query execution failed:', error);
				throw error;
			}
		},

		async queryWithTransaction<T = any>(sqlQuery: string, readOnly: boolean = false): Promise<T[]> {
			if (!isConnected) {
				await pool.connect();
				isConnected = true;
				logger.debug('Connection pool connected');
			}

			// For SQL Server 2008 compatibility, we need to handle transaction nesting carefully
			if (readOnly) {
				// For read-only operations, we can execute directly without wrapping in transaction
				// This avoids transaction nesting issues and is safe for read operations
				try {
					const request = pool.request();
					const result = await request.query(sqlQuery);

					if (consola.level >= 0) {
						logger.debug('Executed read-only query (no explicit transaction to avoid nesting)');
					}

					return result.recordset as T[];
				} catch (error) {
					logger.error('Read-only query execution failed:', error);

					// Check if this looks like a write operation that was blocked
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					const lower = errorMessage.toLowerCase();
					if (
						lower.includes('insert')
						|| lower.includes('update')
						|| lower.includes('delete')
						|| lower.includes('create')
						|| lower.includes('drop')
						|| lower.includes('alter')
					) {
						// This suggests a write operation was attempted in read-only mode
						throw new Error(`Read-only mode violation: Attempted write operation detected. ${errorMessage}`);
					}

					throw error;
				}
			}

			// For write operations, check if we're already in a transaction
			try {
				const request = pool.request();

				// First, check current transaction count to avoid nesting
				const transactionCheckResult = await request.query('SELECT @@TRANCOUNT as trancount');
				const currentTranCount = transactionCheckResult.recordset[0]?.trancount || 0;

				let result;

				if (currentTranCount > 0) {
					// Already in a transaction, execute directly
					result = await request.query(sqlQuery);
					if (consola.level >= 0) {
						logger.debug('Executed write query within existing transaction');
					}
				} else {
					// Not in a transaction, create our own
					const transactionQuery = `
						BEGIN TRANSACTION;
						${sqlQuery};
						COMMIT TRANSACTION;
					`;

					result = await request.query(transactionQuery);
					if (consola.level >= 0) {
						logger.debug('Executed write query with new transaction');
					}
				}

				return result.recordset as T[];
			} catch (error) {
				logger.error('Write transaction query execution failed:', error);
				throw error;
			}
		},

		async close(): Promise<void> {
			if (isConnected) {
				await pool.close();
				isConnected = false;
				logger.info('Connection pool closed');
			}
		},
	};
}
