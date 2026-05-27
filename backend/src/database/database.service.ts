import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const rawConnectionString = process.env.DATABASE_URL;
    if (!rawConnectionString) {
      throw new Error("DATABASE_URL is required");
    }

    const connectionUrl = new URL(rawConnectionString);
    // Avoid pg/pg-connection-string sslmode side-effects from URL params.
    connectionUrl.searchParams.delete("sslmode");
    connectionUrl.searchParams.delete("uselibpqcompat");
    connectionUrl.searchParams.delete("sslcert");
    connectionUrl.searchParams.delete("sslkey");
    connectionUrl.searchParams.delete("sslrootcert");
    const connectionString = connectionUrl.toString();

    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = []
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
