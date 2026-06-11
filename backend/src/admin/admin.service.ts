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
  fecha_registro?: string;
};

export type AccessProfile = {
  email: string;
  role: "admin" | "cliente";
  isAdmin: boolean;
  canAccessDashboard: boolean;
  canAnswerSurvey: boolean;
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

    const isAdmin = await this.isAdminInDatabase(email);
    if (!isAdmin) {
      throw new UnauthorizedException("Admin access required");
    }

    return { isAdmin: true, email };
  }

  async syncUserFromToken(token: string): Promise<AccessProfile> {
    return await this.getAccessProfileFromToken(token);
  }

  async getAccessProfileFromToken(token: string): Promise<AccessProfile> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new UnauthorizedException("Missing Clerk backend configuration");
    }

    const profile = await this.resolveClerkProfile(token, secretKey);
    const user = await this.findUserByEmail(profile.email);

    if (!user) {
      this.logger.warn(
        JSON.stringify({
          event: "user_not_found_for_beta_access",
          email: this.maskEmail(profile.email),
        })
      );

      return {
        email: profile.email,
        role: "cliente",
        isAdmin: false,
        canAccessDashboard: false,
        canAnswerSurvey: true,
      };
    }

    this.logger.log(
      JSON.stringify({
        event: "user_loaded_from_database",
        email: this.maskEmail(user.email),
        role: user.rol,
      })
    );

    return this.mapAccessProfile(user);
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

  private async findUserByEmail(email: string): Promise<UsuarioRow | null> {
    const result = await this.db.query<UsuarioRow>(
      `
        SELECT id, nombre, email, rol, activo
        FROM public.usuarios
        WHERE lower(email) = $1
        LIMIT 1
      `,
      [email]
    );

    return result.rows[0] ?? null;
  }

  private mapAccessProfile(user: UsuarioRow): AccessProfile {
    const role = this.resolveAccessRole(user);
    return {
      email: user.email,
      role,
      isAdmin: role === "admin",
      canAccessDashboard: role === "admin",
      canAnswerSurvey: role === "cliente",
    };
  }

  private resolveAccessRole(user: UsuarioRow): AccessProfile["role"] {
    return user.rol === "admin" && user.activo ? "admin" : "cliente";
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
