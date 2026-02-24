import * as jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
}
