import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import {
	BaseEntity,
	defineConfig,
	Entity,
	MikroORM,
	OneToOne,
	Opt,
	PrimaryKey,
	Property,
	ReflectMetadataProvider,
	types,
} from '@mikro-orm/postgresql';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { toMikroOrmQuery } from './toMikroOrmQuery';

@Entity({ tableName: 'users' })
class UserEntity extends BaseEntity {
	@PrimaryKey({ type: types.bigint })
	id!: number;

	@Property({ type: types.string, nullable: true })
	name?: string;

	@Property({ type: types.string, nullable: true })
	email?: string;

	@Property({ type: types.bigint, nullable: true })
	age?: number;

	@Property({ type: types.boolean, nullable: true, default: false })
	active?: boolean;

	@Property({ type: types.array, nullable: true })
	tags?: string[];

	@Property({ type: types.json, nullable: true })
	attrs?: Record<string, any>;

	@OneToOne(() => UserProfileEntity, 'user', { deleteRule: 'cascade' })
	profile?: UserProfileEntity;
}

@Entity({ tableName: 'user_profile' })
class UserProfileEntity extends BaseEntity {
	@PrimaryKey({ type: types.bigint })
	id!: number;

	@Property({ type: types.bigint, nullable: false, persist: false })
	get userId(): Opt<number> {
		return this.user?.id;
	}

	@Property({ type: types.string, nullable: true })
	bio?: string;

	@Property({ type: types.bigint, nullable: true })
	age?: number;

	@Property({ type: types.json, nullable: true })
	attrs?: Record<string, any>;

	@OneToOne(() => UserEntity)
	user!: UserEntity;
}

let pglite: PGlite;
let socketServer: PGLiteSocketServer;
let orm: MikroORM;
// pg library expects a directory and will append .s.PGSQL.5432
// So we create a directory and put the socket file in it
const SOCKET_DIR = join(tmpdir(), `pglite-test-${Date.now()}`);
const SOCKET_PATH = join(SOCKET_DIR, '.s.PGSQL.5432');

async function getOrm() {
	if (!pglite) {
		// Create directory for socket
		mkdirSync(SOCKET_DIR, { recursive: true });

		// Create PGlite instance
		pglite = new PGlite();
		await pglite.waitReady;

		// Create and start socket server
		// The socket file will be created at SOCKET_PATH
		socketServer = new PGLiteSocketServer({
			db: pglite,
			path: SOCKET_PATH,
		});
		await socketServer.start();
		// Give the socket server a moment to be ready
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	if (!orm) {
		// Configure MikroORM to connect via the Unix socket
		// pg library expects host to be a directory and will append .s.PGSQL.5432
		// So we provide the directory containing the socket file
		orm = await MikroORM.init(
			defineConfig({
				entities: [UserEntity, UserProfileEntity],
				discovery: { disableDynamicFileAccess: true, requireEntitiesArray: true },
				dbName: 'postgres',
				// Use driverOptions to configure pg connection for Unix socket
				driverOptions: {
					connection: {
						host: SOCKET_DIR, // Directory containing the socket file
						database: 'postgres',
						user: 'postgres',
						password: 'postgres',
					},
				},
				metadataProvider: ReflectMetadataProvider,
				// debug: true,
			}),
		);

		// Create schema
		const schema = orm.getSchemaGenerator();
		await schema.createSchema();
	}

	return { orm, em: orm.em.fork() };
}

beforeAll(async () => {
	await getOrm();
});

afterAll(async () => {
	if (orm) {
		await orm.close();
	}
	if (socketServer) {
		await socketServer.stop();
	}
	if (pglite) {
		await pglite.close();
	}
});

describe('PGlite MikroORM Miniquery Tests', () => {
	test('should setup database and entities', async () => {
		const { em } = await getOrm();
		const userRepo = em.getRepository(UserEntity);
		const profileRepo = em.getRepository(UserProfileEntity);

		expect(userRepo).toBeDefined();
		expect(profileRepo).toBeDefined();
	});

	test('should query UserEntity with various query patterns', async () => {
		const { em } = await getOrm();
		const repo = em.getRepository(UserEntity);

		// Create comprehensive test data
		const users = [
			repo.create({
				id: 1,
				name: 'Alice',
				email: 'alice@example.com',
				age: 25,
				active: true,
				tags: ['admin', 'user'],
				attrs: { role: 'admin', level: 5, settings: { theme: 'dark' } },
			}),
			repo.create({
				id: 2,
				name: 'Bob',
				email: 'bob@example.com',
				age: 30,
				active: false,
				tags: ['user'],
				attrs: { role: 'user', level: 3 },
			}),
			repo.create({
				id: 3,
				name: 'Charlie',
				email: null,
				age: 35,
				active: true,
				tags: ['moderator', 'user'],
				attrs: { role: 'moderator', level: 7 },
			}),
		];

		await em.persistAndFlush(users);

		// Test queries with expected results
		const testCases: Array<[string, (results: UserEntity[]) => void]> = [
			// Basic equality
			[
				'name = "Alice"',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Alice');
				},
			],
			[
				'name = "Bob"',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Bob');
				},
			],

			// Numeric comparisons
			['age > 25', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Bob', 'Charlie'])],
			['age >= 30', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Bob', 'Charlie'])],
			[
				'age < 30',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Alice');
				},
			],
			[
				'age <= 25',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Alice');
				},
			],
			[
				'age = 30',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Bob');
				},
			],

			// Boolean
			['active = true', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Alice', 'Charlie'])],
			[
				'active = false',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Bob');
				},
			],

			// AND conditions
			[
				'age > 25 and active = true',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Charlie');
				},
			],
			[
				'age > 20 and age < 30',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Alice');
				},
			],
			['age >= 25 and age <= 30', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Alice', 'Bob'])],

			// OR conditions
			['age < 26 or age > 34', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Alice', 'Charlie'])],
			['name = "Alice" or name = "Bob"', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Alice', 'Bob'])],

			// JSON field access
			[
				'attrs.role = "admin"',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Alice');
				},
			],
			[
				'attrs.role = "user"',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Bob');
				},
			],
			['attrs.level > 4', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Alice', 'Charlie'])],
			['attrs.level >= 5', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Alice', 'Charlie'])],
			[
				'attrs.level < 5',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Bob');
				},
			],

			// Nested JSON field access
			[
				'attrs.settings.theme = "dark"',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Alice');
				},
			],

			// Array operations
			[
				'tags @> ["admin"]',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Alice');
				},
			],
			['tags @> ["user"]', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Alice', 'Bob', 'Charlie'])],
			[
				'tags && ["moderator"]',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Charlie');
				},
			],
			[
				'tags && ["admin"]',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Alice');
				},
			],

			// NULL checks
			[
				'email is null',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].name).toBe('Charlie');
				},
			],
			['email is not null', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Alice', 'Bob'])],

			// BETWEEN
			['age between 25 and 30', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Alice', 'Bob'])],
			['age between 30 and 35', (r) => expect(r.map((u) => u.name).sort()).toEqual(['Bob', 'Charlie'])],

			// Complex queries
			[
				'active = true and (age > 25 or attrs.level > 4)',
				(r) => expect(r.map((u) => u.name).sort()).toEqual(['Alice', 'Charlie']),
			],
			[
				'(age < 30 or age > 30) and active = true',
				(r) => expect(r.map((u) => u.name).sort()).toEqual(['Alice', 'Charlie']),
			],
		];

		// Run all test cases
		for (const [query, assertion] of testCases) {
			const mikroQuery = toMikroOrmQuery(query, { em, Entity: UserEntity });
			const results = await repo.qb().where(mikroQuery).getResult();
			assertion(results);
		}

		// Clean up
		await em.removeAndFlush(users);
	});

	test('should query UserProfileEntity with various query patterns', async () => {
		const { em } = await getOrm();
		const userRepo = em.getRepository(UserEntity);
		const profileRepo = em.getRepository(UserProfileEntity);

		const user1 = userRepo.create({
			id: 10,
			name: 'Alice',
			age: 25,
		});
		const user2 = userRepo.create({
			id: 11,
			name: 'Bob',
			age: 30,
		});

		await em.persistAndFlush([user1, user2]);

		const profiles = [
			profileRepo.create({
				id: 10,
				user: user1,
				bio: 'Software engineer',
				age: 25,
				attrs: { location: 'NYC', skills: ['typescript', 'node'] },
			}),
			profileRepo.create({
				id: 11,
				user: user2,
				bio: 'Designer',
				age: 30,
				attrs: { location: 'SF', skills: ['design', 'figma'] },
			}),
		];

		await em.persistAndFlush(profiles);

		// Test queries with expected results
		const testCases: Array<[string, (results: UserProfileEntity[]) => void]> = [
			[
				'age > 25',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].bio).toBe('Designer');
				},
			],
			[
				'age = 25',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].bio).toBe('Software engineer');
				},
			],
			[
				'bio = "Designer"',
				(r) => {
					expect(r).toHaveLength(1);
					expect(Number(r[0].age)).toBe(30);
				},
			],
			[
				'attrs.location = "NYC"',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].bio).toBe('Software engineer');
				},
			],
			[
				'attrs.location = "SF"',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].bio).toBe('Designer');
				},
			],
			[
				'age between 20 and 28',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].bio).toBe('Software engineer');
				},
			],
			[
				'age between 28 and 35',
				(r) => {
					expect(r).toHaveLength(1);
					expect(r[0].bio).toBe('Designer');
				},
			],
			// Note: JSON array operations may not work the same as PostgreSQL array types
			// attrs.skills is stored as JSON, not as a PostgreSQL array type
		];

		// Run all test cases
		for (const [query, assertion] of testCases) {
			const mikroQuery = toMikroOrmQuery(query, { em, Entity: UserProfileEntity });
			const results = await profileRepo.qb().where(mikroQuery).getResult();
			assertion(results);
		}

		// Clean up
		await em.removeAndFlush([...profiles, user1, user2]);
	});
});
