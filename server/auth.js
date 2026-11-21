import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import prisma from './prisma.js';

export const SESSION_COOKIE_NAME = 'alchemist_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 hari

function getJwtSecret() {
  const secret =
    process.env.JWT_SECRET || 'alchemist-archive-school-library-dev-fallback-secret-key';
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plainPassword) {
  return bcrypt.hash(String(plainPassword), 10);
}

export async function verifyPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(String(plainPassword), String(hashedPassword));
}

export async function signSessionToken(user) {
  return new SignJWT({
    sub: user.id,
    username: user.username,
    role: user.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}

function isHttpsRequest(req) {
  return Boolean(req?.secure || req?.headers?.['x-forwarded-proto'] === 'https');
}

export function setSessionCookie(res, token, req) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttpsRequest(req),
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS * 1000
  });
}

export function clearSessionCookie(res, req) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttpsRequest(req),
    path: '/'
  });
}

export function serializeUser(user) {
  if (!user) return null;
  const dbRole = String(user.role || 'SISWA').toUpperCase();
  const uiRole = dbRole.toLowerCase();
  const jurusanClean =
    user.jurusan && user.jurusan !== 'Semua Jurusan' ? user.jurusan : '';
  const defaultClass =
    user.jenjang && user.kelas
      ? `${user.jenjang} Kelas ${user.kelas}${jurusanClean ? ` ${jurusanClean}` : ''}`
      : uiRole === 'guru'
        ? 'Dewan Guru Pustaka Nusantara'
        : uiRole === 'admin'
          ? 'Pengurus Perpustakaan Sekolah'
          : 'Umum';
  const defaultClassLabel =
    user.jenjang && user.kelas
      ? `${user.jenjang} • Kelas ${user.kelas}${jurusanClean ? ` • ${jurusanClean}` : ''}`
      : defaultClass;

  return {
    id: user.id,
    username: user.username,
    role: uiRole,
    dbRole,
    name: user.nama,
    nama: user.nama,
    nisn: user.nisn || null,
    jenjang: user.jenjang || (uiRole === 'siswa' ? 'SMK' : null),
    kelas: user.kelas || null,
    level: user.kelas || (uiRole === 'guru' ? 'Guru' : uiRole === 'admin' ? 'Admin' : '10'),
    jurusan: user.jurusan || 'Semua Jurusan',
    class: user.kelas_label || defaultClassLabel,
    className: user.kelas_label || defaultClass,
    classLabel: user.kelas_label || defaultClassLabel,
    cardCode: user.guild_id || user.nisn || user.username,
    guildId: user.guild_id || user.nisn || user.username,
    title:
      user.title ||
      (uiRole === 'admin'
        ? 'Grand Archivist & Pustakawan'
        : uiRole === 'guru'
          ? 'Guild Mentor (Guru)'
          : 'Apprentice Scholar'),
    avatar: uiRole === 'admin' ? '👑' : uiRole === 'guru' ? '📜' : '⚔️',
    color: uiRole === 'admin' ? '#D4AF37' : uiRole === 'guru' ? '#38BDF8' : '#10B981',
    phone: user.phone || '',
    xp: Number(user.xp || 0),
    streakDays: Number(user.streak_days || 1),
    createdAt: user.createdAt
  };
}

export async function attachSessionUser(req, _res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (!token) {
      req.user = null;
      return next();
    }
    const payload = await verifySessionToken(token);
    if (!payload?.sub) {
      req.user = null;
      return next();
    }
    const dbUser = await prisma.user.findUnique({
      where: { id: String(payload.sub) }
    });
    req.user = dbUser || null;
    return next();
  } catch (err) {
    req.user = null;
    return next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Sesi login tidak ditemukan atau telah berakhir. Silakan masuk terlebih dahulu.'
    });
  }
  return next();
}

export function requireRoles(...allowedRoles) {
  const normalized = allowedRoles.map((r) => String(r).toUpperCase());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autentikasi diperlukan untuk mengakses fitur ini.'
      });
    }
    if (!normalized.includes(String(req.user.role).toUpperCase())) {
      return res.status(403).json({
        error: 'Akses ditolak: hak akses role Anda tidak mencukupi untuk aksi ini.'
      });
    }
    return next();
  };
}
