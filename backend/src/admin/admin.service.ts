import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { DatabaseService } from "../database/database.service";

type UsuarioAdminRow = {
  id: string;
};

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  private getAdminEmails(): string[] {
    return (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value: string) => value.length > 0);
  }

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

    const payload = await verifyToken(token, { secretKey });
    const userId = String(payload.sub ?? "");
    if (!userId) {
      throw new UnauthorizedException("Invalid Clerk token");
    }

    const clerk = createClerkClient({ secretKey });
    const user = await clerk.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!email) {
      throw new UnauthorizedException("Clerk user has no primary email");
    }

    const isAdmin = this.getAdminEmails().includes(email) || (await this.isAdminInDatabase(email));
    if (!isAdmin) {
      throw new UnauthorizedException("Admin access required");
    }

    return { isAdmin: true, email };
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

  validateAdminByEmail(email: string | null): { isAdmin: boolean; email?: string } {
    const adminEmails = this.getAdminEmails();
    if (!email) throw new UnauthorizedException("Missing or invalid token");
    const isAdmin = adminEmails.includes(email.toLowerCase());
    if (!isAdmin) throw new UnauthorizedException("Admin access required");
    return { isAdmin, email };
  }
}
