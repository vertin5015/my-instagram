import jwt, { type SignOptions } from "jsonwebtoken";

// JWT 密钥，应该从环境变量中获取
const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * 生成 JWT token
 */
export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * 验证 JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("[JWT_VERIFY_ERROR]", error);
    return null;
  }
}

/**
 * 从请求中获取 token（从 cookie 或 Authorization header）
 */
export function getTokenFromRequest(req: Request): string | null {
  // 优先从 cookie 中获取
  const cookies = req.headers.get("cookie");
  if (cookies) {
    const tokenMatch = cookies.match(/auth-token=([^;]+)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }

  // 如果没有 cookie，尝试从 Authorization header 获取
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}
