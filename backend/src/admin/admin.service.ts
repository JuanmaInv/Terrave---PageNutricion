import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { DatabaseService } from "../database/database.service";

type UsuarioAdminRow = {
  id: string;
};

type ClerkTokenPayload = {
  sub?: string | null;
};

type ClerkUserLike = {
  firstName?: string | null;
  lastName?: string | null;
  primaryEmailAddress?: {
    emailAddress?: string | null;
  } | null;
};

type ClerkClientLike = {
  users: {
    getUser: (userId: string) => Promise<ClerkUserLike>;
  };
};

type UsuarioRow = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
};

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly db: DatabaseService) {}

  getTokenFromAuthorization(authorization?: string): string {
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    return authorization.slice("Bearer ".length);
  }

  async validateAdminToken(token: string): Promise<{ isAdmin: boolean; email: string }> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new UnauthorizedException("Missing Clerk backend configuration");
    }

    const profile = await this.resolveClerkProfile(token, secretKey);
    const email = profile.email;

    const isAdmin = await this.isAdmin(email);
    if (!isAdmin) {
      this.logger.warn(
        JSON.stringify({
          event: "admin_access_denied",
          userId: profile.userId,
          email: this.maskEmail(email),
        })
      );
      throw new UnauthorizedException("Admin access required");
    }

    this.logger.log(
      JSON.stringify({
        event: "admin_access_granted",
        userId: profile.userId,
        email: this.maskEmail(email),
      })
    );

    return { isAdmin: true, email };
  }

  async syncUserFromToken(token: string): Promise<{ email: string; role: string; isAdmin: boolean }> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new UnauthorizedException("Missing Clerk backend configuration");
    }

    const profile = await this.resolveClerkProfile(token, secretKey);
    const user = await this.upsertUser(profile);

    this.logger.log(
      JSON.stringify({
        event: "user_synced_from_clerk",
        userId: profile.userId,
        email: this.maskEmail(user.email),
        role: user.rol,
      })
    );

    return {
      email: user.email,
      role: user.rol,
      isAdmin: user.rol === "admin" && user.activo,
    };
  }

  private async resolveClerkProfile(token: string, secretKey: string): Promise<{
    userId: string;
    email: string;
    name: string;
  }> {
    const payload = await this.verifyClerkJwt(token, secretKey);
    const userId = String(payload.sub ?? "");
    if (!userId) {
      throw new UnauthorizedException("Invalid Clerk token");
    }

    const clerk = this.buildClerkClient(secretKey);
    const user = await clerk.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email) {
      throw new UnauthorizedException("Clerk user has no primary email");
    }

    const firstName = user.firstName?.trim() ?? "";
    const lastName = user.lastName?.trim() ?? "";
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      userId,
      email,
      name: fullName || email.split("@")[0] || "Cliente",
    };
  }

  private async isAdmin(email: string): Promise<boolean> {
    const envAdmins = this.getAdminEmailsFromEnv();
    if (envAdmins.has(email)) {
      return true;
    }

    try {
      return await this.isAdminInDatabase(email);
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: "admin_db_lookup_failed",
          email: this.maskEmail(email),
          reason: error instanceof Error ? error.message : "unknown",
        })
      );
      return false;
    }
  }

  private getAdminEmailsFromEnv(): Set<string> {
    if (process.env.NODE_ENV === "production") {
      return new Set<string>();
    }

    const raw = process.env.ADMIN_EMAILS?.trim() ?? "";
    if (!raw) {
      return new Set<string>();
    }

    return new Set(
      raw
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0),
    );
  }

  protected async verifyClerkJwt(
    token: string,
    secretKey: string
  ): Promise<ClerkTokenPayload> {
    return await verifyToken(token, { secretKey });
  }

  protected buildClerkClient(secretKey: string): ClerkClientLike {
    return createClerkClient({ secretKey });
  }

  private async upsertUser(profile: {
    email: string;
    name: string;
  }): Promise<UsuarioRow> {
    const result = await this.db.query<UsuarioRow>(
      `
        INSERT INTO public.usuarios (nombre, email, rol, activo)
        VALUES ($1, $2, 'cliente', true)
        ON CONFLICT (email) DO UPDATE
        SET
          nombre = EXCLUDED.nombre,
          activo = true
        RETURNING id, nombre, email, rol, activo
      `,
      [profile.name, profile.email],
    );

    return result.rows[0];
  }

  private async isAdminInDatabase(email: string): Promise<boolean> {
    const result = await this.db.query<UsuarioAdminRow>(
      `
        SELECT id
        FROM public.usuarios
        WHERE lower(email) = $1
          AND rol = 'admin'
          AND activo = true
        LIMIT 1
      `,
      [email]
    );

    return (result.rowCount ?? 0) > 0;
  }

  private maskEmail(email: string): string {
    const [name, domain] = email.split("@");
    if (!name || !domain) return "redacted";
    return `${name.slice(0, 2)}***@${domain}`;
  }
}
