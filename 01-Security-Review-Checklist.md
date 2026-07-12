# Security Review Checklist
## Stack: Nuxt JS + Drizzle + Zod + Bun + PostgreSQL

Checklist ini digunakan untuk audit keamanan aplikasi dengan stack Nuxt JS + Drizzle + Zod + Bun + PostgreSQL.

---

# 1. Authentication

- [ ] Semua endpoint sensitif membutuhkan authentication.
- [ ] Token/session memiliki expiration.
- [ ] Password di-hash menggunakan Argon2, bcrypt, atau algoritma modern lain.
- [ ] Login memiliki rate limiting.
- [ ] Refresh token disimpan dan dirotasi dengan aman jika digunakan.
- [ ] Logout membatalkan session/token dengan benar.
- [ ] Akun admin memiliki proteksi tambahan seperti MFA jika diperlukan.
- [ ] Error login tidak membocorkan apakah email/username terdaftar.

---

# 2. Authorization & Access Control

- [ ] Setiap endpoint melakukan authorization, bukan hanya authentication.
- [ ] Tidak ada IDOR, misalnya user A bisa akses data user B.
- [ ] Role/permission dicek di server.
- [ ] Admin route/API dilindungi dengan policy/middleware/hook.
- [ ] Resource ownership dicek di service atau route handler.
- [ ] Frontend hide/show menu tidak menggantikan authorization backend.
- [ ] Prinsip least privilege diterapkan.

---

# 3. Input Validation dengan Zod

- [ ] Semua request body divalidasi dengan Zod.
- [ ] Query parameter divalidasi.
- [ ] Route parameter divalidasi.
- [ ] File upload divalidasi.
- [ ] Schema validation tidak hanya dilakukan di frontend.
- [ ] Error validation dikembalikan dengan format konsisten.
- [ ] Tidak menggunakan `any` untuk payload yang belum divalidasi.

Contoh:

```ts
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8)
})
```

---

# 4. SQL Injection Prevention

- [ ] Query menggunakan Drizzle query builder.
- [ ] Raw SQL dihindari kecuali perlu.
- [ ] Raw SQL menggunakan parameter binding.
- [ ] Sorting/filtering menggunakan whitelist kolom.
- [ ] Input user tidak langsung masuk ke SQL string.
- [ ] Query log diperiksa dari pola raw yang berbahaya.

---

# 5. XSS Protection

- [ ] Output user-generated content di-escape.
- [ ] HTML user-generated content disanitasi.
- [ ] CSP dipertimbangkan untuk aplikasi browser.
- [ ] Tidak menggunakan raw HTML tanpa sanitasi.
- [ ] Error message tidak mengandung input mentah yang berbahaya.

---

# 6. CSRF Protection

- [ ] Jika menggunakan cookie-based session, CSRF protection diterapkan.
- [ ] SameSite cookie dikonfigurasi.
- [ ] API token-based stateless tidak mencampur session cookie tanpa proteksi.
- [ ] Mutating endpoint tidak menerima request lintas situs tanpa proteksi.

---

# 7. Session, Cookie, JWT, Token

- [ ] Cookie menggunakan HttpOnly jika menyimpan token/session.
- [ ] Cookie menggunakan Secure di production.
- [ ] Cookie menggunakan SameSite sesuai kebutuhan.
- [ ] JWT memiliki expiration pendek.
- [ ] Secret JWT kuat dan tidak hardcoded.
- [ ] Token refresh dapat dicabut.
- [ ] Token tidak disimpan di localStorage jika risikonya tinggi.

---

# 8. Secrets & Runtime Config

- [ ] `.env` tidak ter-commit.
- [ ] Secret disimpan di environment variable atau secret manager.
- [ ] Public runtime config tidak berisi secret.
- [ ] Database URL tidak terekspos ke client.
- [ ] Secret tidak muncul di log.
- [ ] Secret production berbeda dari development.
- [ ] Rotasi secret memungkinkan.

---

# 9. File Upload Security

- [ ] Tipe file divalidasi.
- [ ] Ukuran file dibatasi.
- [ ] Nama file di-randomize.
- [ ] File executable ditolak.
- [ ] File private tidak disimpan di public path.
- [ ] Download file memeriksa authorization.
- [ ] Virus scan dipertimbangkan untuk aplikasi sensitif.

---

# 10. API Security

- [ ] Rate limiting diterapkan.
- [ ] CORS dikonfigurasi ketat.
- [ ] Response tidak mengekspos data sensitif.
- [ ] Error tidak membocorkan stack trace.
- [ ] Security headers diterapkan.
- [ ] Endpoint admin tidak terbuka publik.
- [ ] Audit logging tersedia untuk aksi sensitif.

---

# 11. PostgreSQL Security

- [ ] Database user menggunakan least privilege.
- [ ] Database tidak terbuka publik tanpa kontrol.
- [ ] SSL database digunakan jika diperlukan.
- [ ] Backup terenkripsi.
- [ ] Data sensitif dienkripsi jika perlu.
- [ ] Migration production tidak mengandung secret.

---

# 12. Dependency Security

- [ ] Dependency diperiksa vulnerability.
- [ ] Package tidak digunakan dihapus.
- [ ] Lockfile digunakan.
- [ ] Versi runtime dan framework masih supported.
- [ ] Supply chain risk diperhatikan untuk package kecil/tidak populer.

---

# Prompt Audit untuk AI

```txt
Lakukan audit Security Review untuk project ini.

Stack:
- Nuxt JS + Drizzle + Zod + Bun + PostgreSQL
- Runtime: Bun
- Framework: Nuxt JS
- Server layer: Nitro server API routes
- ORM: Drizzle ORM
- Validation: Zod
- Database: PostgreSQL / pgsql

Periksa:
1. Authentication
2. Authorization
3. Zod validation
4. SQL Injection prevention
5. XSS
6. CSRF
7. Session/cookie/JWT/token
8. Secrets
9. File upload
10. API security
11. PostgreSQL security
12. Dependency security

Untuk setiap temuan, berikan:
- Lokasi file/folder/endpoint/config.
- Masalah yang ditemukan.
- Dampak teknis atau risiko bisnis.
- Severity: Critical, High, Medium, Low.
- Rekomendasi perbaikan.
- Contoh kode atau konfigurasi perbaikan jika memungkinkan.

Berikan skor:
- Authentication Security: 0-100
- Authorization Security: 0-100
- Input/Data Security: 0-100
- API Security: 0-100
- Production Security: 0-100
- Overall Score: 0-100

Prioritaskan temuan yang paling berdampak terhadap keamanan, maintainability, reliability, dan production readiness.
```
