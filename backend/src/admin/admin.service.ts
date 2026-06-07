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
  primaryEmailAddress?: {
    emailAddress?: string | null;
  } | null;
};

type ClerkClientLike = {
  users: {
    getUser: (userId: string) => Promise<ClerkUserLike>;
  };
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

    const isAdmin = await this.isAdminInDatabase(email);
    if (!isAdmin) {
      this.logger.warn(
        JSON.stringify({
          event: "admin_access_denied",
          userId,
          email: this.maskEmail(email),
        })
      );
      throw new UnauthorizedException("Admin access required");
    }

    this.logger.log(
      JSON.stringify({
        event: "admin_access_granted",
        userId,
        email: this.maskEmail(email),
      })
    );

    return { isAdmin: true, email };
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
