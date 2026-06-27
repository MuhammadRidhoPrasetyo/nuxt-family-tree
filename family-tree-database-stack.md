# Family Tree Management System

## Tech Stack

| Layer | Stack |
|---|---|
| Runtime | Bun |
| Frontend | Nuxt 4 |
| Database ORM | Drizzle ORM |
| Validation | Zod |
| Authentication | Better Auth |
| Diagram / Family Tree UI | Vue Flow |
| Database | PostgreSQL / MySQL recommended |
| Deployment | VPS / Docker / Coolify / Railway / Render |

---

# 1. Overview

Aplikasi ini dirancang sebagai platform **family tree / silsilah keluarga** berbasis web yang mendukung:

- Multi-user
- Multi-family tree
- Anggota keluarga hidup maupun wafat
- Banyak anak tanpa batas
- Banyak pasangan / riwayat pernikahan
- Relasi anak kandung, angkat, tiri, atau asuh
- Hak akses keluarga
- Undangan anggota keluarga
- Privasi data
- Upload foto dan dokumen
- Audit log
- Donasi
- Visualisasi family tree menggunakan Vue Flow

---

# 2. Core Entity Structure

```text
users
 ├── families
 │    ├── family_members
 │    │    ├── parent_child_relations
 │    │    └── marriages
 │    │
 │    ├── family_user_roles
 │    ├── invitations
 │    ├── privacy_settings
 │    └── media_files
 │
 ├── donations
 └── audit_logs
```

---

# 3. Tables

## 3.1 users

Digunakan untuk akun pengguna. Integrasi utama dikelola oleh **Better Auth**.

| Field | Type | Description |
|---|---|---|
| id | varchar / uuid | Primary key |
| name | varchar | Nama pengguna |
| email | varchar | Email unik |
| email_verified | boolean | Status verifikasi email |
| image | text | Foto profil |
| role | enum | USER, ADMIN, SUPER_ADMIN |
| status | enum | ACTIVE, SUSPENDED, DELETED |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diperbarui |

> Catatan: Better Auth biasanya memiliki struktur tabel sendiri untuk user, session, account, dan verification. Field tambahan seperti `role` dan `status` dapat ditambahkan sesuai kebutuhan aplikasi.

---

## 3.2 families

Menyimpan data family tree.

| Field | Type | Description |
|---|---|---|
| id | uuid / bigint | Primary key |
| owner_user_id | uuid / varchar | Pemilik family tree |
| name | varchar | Nama family tree |
| slug | varchar | URL unik |
| description | text | Deskripsi |
| visibility | enum | PRIVATE, INVITE_ONLY, PUBLIC |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diperbarui |
| deleted_at | timestamp nullable | Soft delete |

### Index

```text
UNIQUE(slug)
INDEX(owner_user_id)
INDEX(visibility)
```

---

## 3.3 family_members

Menyimpan data individu dalam family tree.

| Field | Type | Description |
|---|---|---|
| id | uuid / bigint | Primary key |
| family_id | uuid / bigint | Relasi ke families |
| full_name | varchar | Nama lengkap |
| nickname | varchar nullable | Nama panggilan |
| gender | enum | MALE, FEMALE, UNKNOWN |
| birth_place | varchar nullable | Tempat lahir |
| birth_date | date nullable | Tanggal lahir |
| birth_date_precision | enum | FULL, YEAR_MONTH, YEAR, UNKNOWN |
| is_alive | boolean | Status hidup |
| death_date | date nullable | Tanggal wafat |
| death_place | varchar nullable | Tempat wafat |
| death_date_precision | enum | FULL, YEAR_MONTH, YEAR, UNKNOWN |
| occupation | varchar nullable | Pekerjaan |
| education | varchar nullable | Pendidikan |
| religion | varchar nullable | Agama |
| phone | varchar nullable | Nomor telepon |
| email | varchar nullable | Email |
| address | text nullable | Alamat |
| bio | text nullable | Biografi |
| notes_private | text nullable | Catatan privat |
| photo_url | text nullable | Foto utama |
| created_by | uuid / varchar nullable | User pembuat |
| updated_by | uuid / varchar nullable | User terakhir mengubah |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diperbarui |
| deleted_at | timestamp nullable | Soft delete |

### Index

```text
INDEX(family_id)
INDEX(full_name)
INDEX(is_alive)
INDEX(birth_date)
```

---

## 3.4 parent_child_relations

Menyimpan hubungan orang tua dan anak. Tabel ini membuat jumlah anak tidak terbatas.

| Field | Type | Description |
|---|---|---|
| id | uuid / bigint | Primary key |
| family_id | uuid / bigint | Relasi ke families |
| parent_id | uuid / bigint | Relasi ke family_members |
| child_id | uuid / bigint | Relasi ke family_members |
| relation_type | enum | BIOLOGICAL, ADOPTED, STEP, FOSTER, UNKNOWN |
| parent_role | enum | FATHER, MOTHER, PARENT, GUARDIAN |
| created_at | timestamp | Waktu dibuat |

### Constraint

```text
UNIQUE(parent_id, child_id, relation_type)
CHECK(parent_id != child_id)
```

### Index

```text
INDEX(family_id)
INDEX(parent_id)
INDEX(child_id)
```

---

## 3.5 marriages

Menyimpan hubungan pasangan dan riwayat pernikahan.

| Field | Type | Description |
|---|---|---|
| id | uuid / bigint | Primary key |
| family_id | uuid / bigint | Relasi ke families |
| partner_1_id | uuid / bigint | Pasangan pertama |
| partner_2_id | uuid / bigint | Pasangan kedua |
| marriage_date | date nullable | Tanggal menikah |
| marriage_place | varchar nullable | Tempat menikah |
| status | enum | MARRIED, DIVORCED, WIDOWED, SEPARATED, UNKNOWN |
| ended_at | date nullable | Tanggal selesai relasi |
| notes | text nullable | Catatan |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diperbarui |

### Constraint

```text
CHECK(partner_1_id != partner_2_id)
```

### Index

```text
INDEX(family_id)
INDEX(partner_1_id)
INDEX(partner_2_id)
```

---

## 3.6 family_user_roles

Mengatur akses pengguna terhadap sebuah family tree.

| Field | Type | Description |
|---|---|---|
| id | uuid / bigint | Primary key |
| family_id | uuid / bigint | Relasi ke families |
| user_id | uuid / varchar | Relasi ke users |
| role | enum | OWNER, ADMIN, EDITOR, VIEWER |
| created_at | timestamp | Waktu dibuat |

### Constraint

```text
UNIQUE(family_id, user_id)
```

---

## 3.7 invitations

Menyimpan undangan untuk bergabung ke family tree.

| Field | Type | Description |
|---|---|---|
| id | uuid / bigint | Primary key |
| family_id | uuid / bigint | Relasi ke families |
| email | varchar | Email undangan |
| token | varchar | Token undangan |
| role | enum | EDITOR, VIEWER |
| invited_by | uuid / varchar | User pengundang |
| expired_at | timestamp | Waktu kedaluwarsa |
| accepted_at | timestamp nullable | Waktu diterima |
| created_at | timestamp | Waktu dibuat |

### Index

```text
UNIQUE(token)
INDEX(email)
INDEX(family_id)
```

---

## 3.8 privacy_settings

Mengatur privasi family tree.

| Field | Type | Description |
|---|---|---|
| id | uuid / bigint | Primary key |
| family_id | uuid / bigint | Relasi ke families |
| show_living_people | boolean | Menampilkan orang yang masih hidup |
| show_birth_date | boolean | Menampilkan tanggal lahir |
| show_death_date | boolean | Menampilkan tanggal wafat |
| show_contact | boolean | Menampilkan kontak |
| allow_export | boolean | Mengizinkan ekspor data |
| allow_guest_view | boolean | Mengizinkan tamu melihat |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diperbarui |

---

## 3.9 media_files

Menyimpan foto dan dokumen anggota keluarga.

| Field | Type | Description |
|---|---|---|
| id | uuid / bigint | Primary key |
| family_id | uuid / bigint | Relasi ke families |
| family_member_id | uuid / bigint nullable | Relasi ke family_members |
| file_name | varchar | Nama file |
| file_path | text | Path file |
| mime_type | varchar | MIME type |
| file_size | bigint | Ukuran file |
| media_type | enum | PHOTO, DOCUMENT, VIDEO, OTHER |
| uploaded_by | uuid / varchar | User pengunggah |
| created_at | timestamp | Waktu dibuat |

### Index

```text
INDEX(family_id)
INDEX(family_member_id)
INDEX(uploaded_by)
```

---

## 3.10 donations

Menyimpan data donasi.

| Field | Type | Description |
|---|---|---|
| id | uuid / bigint | Primary key |
| user_id | uuid / varchar nullable | User pendonasi |
| family_id | uuid / bigint nullable | Family tree terkait |
| donor_name | varchar nullable | Nama pendonasi |
| donor_email | varchar nullable | Email pendonasi |
| amount | decimal | Nominal |
| currency | varchar | Mata uang, default IDR |
| payment_provider | varchar | Provider pembayaran |
| payment_reference | varchar | Referensi pembayaran |
| status | enum | PENDING, PAID, FAILED, REFUNDED |
| paid_at | timestamp nullable | Waktu pembayaran sukses |
| created_at | timestamp | Waktu dibuat |

---

## 3.11 audit_logs

Menyimpan riwayat perubahan data penting.

| Field | Type | Description |
|---|---|---|
| id | uuid / bigint | Primary key |
| user_id | uuid / varchar nullable | User pelaku |
| family_id | uuid / bigint nullable | Family tree terkait |
| action | varchar | CREATE, UPDATE, DELETE, LOGIN, EXPORT |
| table_name | varchar | Nama tabel |
| record_id | varchar | ID record |
| old_value | json nullable | Data lama |
| new_value | json nullable | Data baru |
| ip_address | varchar nullable | IP address |
| user_agent | text nullable | User agent |
| created_at | timestamp | Waktu dibuat |

---

## 3.12 roles

Menyimpan data peran sistem (RBAC).

| Field | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| name | varchar | Nama role (e.g. SUPER_ADMIN, ADMIN, USER) |
| description | text nullable | Deskripsi role |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diperbarui |

---

## 3.13 permissions

Menyimpan data izin akses (RBAC).

| Field | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| name | varchar | Nama permission (e.g. create:family, delete:family) |
| description | text nullable | Deskripsi permission |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diperbarui |

---

## 3.14 user_roles

Menghubungkan user dengan role (model_has_roles / user_has_roles).

| Field | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| user_id | varchar | ID user (relasi ke users.id) |
| role_id | uuid | ID role (relasi ke roles.id) |
| created_at | timestamp | Waktu dibuat |

---

## 3.15 role_permissions

Menghubungkan role dengan permission.

| Field | Type | Description |
|---|---|---|
| id | uuid | Primary key |
| role_id | uuid | ID role (relasi ke roles.id) |
| permission_id | uuid | ID permission (relasi ke permissions.id) |
| created_at | timestamp | Waktu dibuat |

---


# 4. Drizzle ORM Example

Contoh awal untuk PostgreSQL.

```ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  date,
  pgEnum,
  uniqueIndex,
  index,
  decimal,
  jsonb,
} from 'drizzle-orm/pg-core'

export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'UNKNOWN'])
export const visibilityEnum = pgEnum('visibility', ['PRIVATE', 'INVITE_ONLY', 'PUBLIC'])
export const familyRoleEnum = pgEnum('family_role', ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'])
export const memberRelationEnum = pgEnum('member_relation', ['BIOLOGICAL', 'ADOPTED', 'STEP', 'FOSTER', 'UNKNOWN'])
export const parentRoleEnum = pgEnum('parent_role', ['FATHER', 'MOTHER', 'PARENT', 'GUARDIAN'])
export const marriageStatusEnum = pgEnum('marriage_status', ['MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'UNKNOWN'])
export const donationStatusEnum = pgEnum('donation_status', ['PENDING', 'PAID', 'FAILED', 'REFUNDED'])

export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: varchar('owner_user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 180 }).notNull(),
  description: text('description'),
  visibility: visibilityEnum('visibility').default('PRIVATE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  slugIdx: uniqueIndex('families_slug_idx').on(table.slug),
  ownerIdx: index('families_owner_idx').on(table.ownerUserId),
}))

export const familyMembers = pgTable('family_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  nickname: varchar('nickname', { length: 100 }),
  gender: genderEnum('gender').default('UNKNOWN').notNull(),
  birthPlace: varchar('birth_place', { length: 100 }),
  birthDate: date('birth_date'),
  isAlive: boolean('is_alive').default(true).notNull(),
  deathDate: date('death_date'),
  deathPlace: varchar('death_place', { length: 100 }),
  occupation: varchar('occupation', { length: 100 }),
  education: varchar('education', { length: 100 }),
  religion: varchar('religion', { length: 50 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 150 }),
  address: text('address'),
  bio: text('bio'),
  notesPrivate: text('notes_private'),
  photoUrl: text('photo_url'),
  createdBy: varchar('created_by', { length: 255 }),
  updatedBy: varchar('updated_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  familyIdx: index('family_members_family_idx').on(table.familyId),
  nameIdx: index('family_members_name_idx').on(table.fullName),
}))

export const parentChildRelations = pgTable('parent_child_relations', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  parentId: uuid('parent_id').references(() => familyMembers.id).notNull(),
  childId: uuid('child_id').references(() => familyMembers.id).notNull(),
  relationType: memberRelationEnum('relation_type').default('BIOLOGICAL').notNull(),
  parentRole: parentRoleEnum('parent_role').default('PARENT').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  familyIdx: index('parent_child_family_idx').on(table.familyId),
  parentIdx: index('parent_child_parent_idx').on(table.parentId),
  childIdx: index('parent_child_child_idx').on(table.childId),
}))

export const marriages = pgTable('marriages', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id').references(() => families.id).notNull(),
  partner1Id: uuid('partner_1_id').references(() => familyMembers.id).notNull(),
  partner2Id: uuid('partner_2_id').references(() => familyMembers.id).notNull(),
  marriageDate: date('marriage_date'),
  marriagePlace: varchar('marriage_place', { length: 100 }),
  status: marriageStatusEnum('status').default('UNKNOWN').notNull(),
  endedAt: date('ended_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  familyIdx: index('marriages_family_idx').on(table.familyId),
  partner1Idx: index('marriages_partner_1_idx').on(table.partner1Id),
  partner2Idx: index('marriages_partner_2_idx').on(table.partner2Id),
}))

export const donations = pgTable('donations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }),
  familyId: uuid('family_id').references(() => families.id),
  donorName: varchar('donor_name', { length: 150 }),
  donorEmail: varchar('donor_email', { length: 150 }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('IDR').notNull(),
  paymentProvider: varchar('payment_provider', { length: 50 }),
  paymentReference: varchar('payment_reference', { length: 150 }),
  status: donationStatusEnum('status').default('PENDING').notNull(),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }),
  familyId: uuid('family_id').references(() => families.id),
  action: varchar('action', { length: 100 }).notNull(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: varchar('record_id', { length: 255 }),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

---

# 5. Zod Validation Example

```ts
import { z } from 'zod'

export const createFamilySchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().min(3).max(180).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  visibility: z.enum(['PRIVATE', 'INVITE_ONLY', 'PUBLIC']).default('PRIVATE'),
})

export const createFamilyMemberSchema = z.object({
  familyId: z.string().uuid(),
  fullName: z.string().min(1).max(150),
  nickname: z.string().max(100).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).default('UNKNOWN'),
  birthPlace: z.string().max(100).optional(),
  birthDate: z.coerce.date().optional(),
  isAlive: z.boolean().default(true),
  deathDate: z.coerce.date().optional(),
  deathPlace: z.string().max(100).optional(),
  occupation: z.string().max(100).optional(),
  education: z.string().max(100).optional(),
  religion: z.string().max(50).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  address: z.string().max(2000).optional(),
  bio: z.string().max(5000).optional(),
})

export const createParentChildRelationSchema = z.object({
  familyId: z.string().uuid(),
  parentId: z.string().uuid(),
  childId: z.string().uuid(),
  relationType: z.enum(['BIOLOGICAL', 'ADOPTED', 'STEP', 'FOSTER', 'UNKNOWN']).default('BIOLOGICAL'),
  parentRole: z.enum(['FATHER', 'MOTHER', 'PARENT', 'GUARDIAN']).default('PARENT'),
}).refine((data) => data.parentId !== data.childId, {
  message: 'Parent and child cannot be the same person',
  path: ['childId'],
})

export const createMarriageSchema = z.object({
  familyId: z.string().uuid(),
  partner1Id: z.string().uuid(),
  partner2Id: z.string().uuid(),
  marriageDate: z.coerce.date().optional(),
  marriagePlace: z.string().max(100).optional(),
  status: z.enum(['MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'UNKNOWN']).default('UNKNOWN'),
  endedAt: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
}).refine((data) => data.partner1Id !== data.partner2Id, {
  message: 'Partners cannot be the same person',
  path: ['partner2Id'],
})
```

---

# 6. Vue Flow Data Mapping

Database tidak langsung disimpan sebagai posisi diagram. Data perlu diubah menjadi format `nodes` dan `edges` untuk Vue Flow.

## Node Example

```ts
const nodes = [
  {
    id: 'member-1',
    type: 'personCard',
    position: { x: 100, y: 100 },
    data: {
      memberId: '1',
      fullName: 'Budi Santoso',
      gender: 'MALE',
      isAlive: true,
      photoUrl: '/uploads/budi.jpg',
    },
  },
]
```

## Edge Example

```ts
const edges = [
  {
    id: 'parent-1-child-3',
    source: 'member-1',
    target: 'member-3',
    type: 'smoothstep',
  },
]
```

## Recommended Frontend Packages

```bash
bun add @vue-flow/core @vue-flow/background @vue-flow/controls @vue-flow/minimap
bun add dagre
```

Gunakan `dagre` atau `elkjs` untuk auto-layout antar generasi.

---

# 7. Recommended Project Structure

```text
app/
├── app.vue
├── pages/
│   ├── index.vue
│   ├── login.vue
│   ├── families/
│   │   ├── index.vue
│   │   └── [slug].vue
│   └── dashboard.vue
│
├── components/
│   ├── family-tree/
│   │   ├── FamilyTreeCanvas.vue
│   │   ├── PersonNode.vue
│   │   └── MemberForm.vue
│   └── ui/
│
├── server/
│   ├── api/
│   │   ├── families/
│   │   ├── members/
│   │   ├── relations/
│   │   ├── marriages/
│   │   └── donations/
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── auth.ts
│   └── utils/
│
├── shared/
│   ├── schemas/
│   │   ├── family.schema.ts
│   │   ├── member.schema.ts
│   │   └── relation.schema.ts
│   └── types/
│
├── drizzle.config.ts
├── nuxt.config.ts
└── package.json
```

---

# 8. Better Auth Notes

Better Auth digunakan untuk:

- Login email/password
- OAuth login jika diperlukan
- Session management
- Middleware proteksi halaman
- Role-based access control

Rekomendasi role aplikasi:

```text
SUPER_ADMIN
ADMIN
USER
```

Rekomendasi role family tree:

```text
OWNER
ADMIN
EDITOR
VIEWER
```

Akses ideal:

| Role | View | Add | Edit | Delete | Invite | Export |
|---|---|---|---|---|---|---|
| OWNER | Yes | Yes | Yes | Yes | Yes | Yes |
| ADMIN | Yes | Yes | Yes | Yes | Yes | Optional |
| EDITOR | Yes | Yes | Yes | No | No | No |
| VIEWER | Yes | No | No | No | No | No |

---

# 9. Deployment Recommendation

## Minimum VPS

```text
2 CPU
2 GB RAM
40 GB SSD
Ubuntu 22.04+
```

## Suggested Services

```text
Nuxt app       : Bun / Node server
Database       : PostgreSQL
File storage   : S3 compatible storage / Cloudflare R2
Reverse proxy  : Nginx / Caddy / Traefik
SSL            : Let's Encrypt
Process manager: Docker / PM2 / systemd
```

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/familytree"
BETTER_AUTH_SECRET="change-this-secret"
BETTER_AUTH_URL="https://yourdomain.com"
NUXT_PUBLIC_APP_URL="https://yourdomain.com"
STORAGE_PROVIDER="s3"
S3_BUCKET="family-tree-media"
S3_REGION="auto"
S3_ENDPOINT="https://example.r2.cloudflarestorage.com"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
```

---

# 10. Production Checklist

## Security

- Gunakan HTTPS
- Hash password dikelola oleh Better Auth
- Rate limit login dan register
- Validasi input dengan Zod
- Sanitasi output user-generated content
- Gunakan signed URL untuk media privat
- Jangan tampilkan data orang yang masih hidup di tree publik tanpa izin

## Database

- Gunakan migration Drizzle
- Tambahkan index pada foreign key
- Gunakan soft delete untuk data penting
- Backup database harian
- Audit log untuk operasi penting

## Privacy

- Default family tree harus PRIVATE
- Tampilkan tanggal lahir orang hidup hanya jika diizinkan
- Tampilkan kontak hanya untuk role tertentu
- Export data hanya untuk OWNER atau ADMIN

## Performance

- Pagination daftar member
- Lazy loading tree besar
- Cache query family tree
- Generate layout di server untuk tree besar
- Optimasi gambar sebelum upload

## Legal / Compliance

- Buat halaman Privacy Policy
- Buat halaman Terms of Service
- Tambahkan fitur delete account
- Tambahkan fitur export data
- Tambahkan laporan konten / report abuse

---

# 11. Donation Concept

Karena konsep aplikasi berbasis donasi, fitur yang bisa ditambahkan:

- Tombol donasi global
- Donasi untuk mendukung server
- Badge supporter opsional
- Tidak membatasi fitur utama berdasarkan pembayaran
- Transparansi biaya server bulanan

Provider pembayaran Indonesia yang bisa dipertimbangkan:

```text
Midtrans
Xendit
Tripay
Duitku
QRIS Static / Dynamic
```

---

# 12. Future Roadmap

- Export PDF family tree
- Import / export GEDCOM
- Auto-layout generation
- Relationship finder
- Timeline kehidupan
- Peta lokasi keluarga
- QR code profil anggota
- Halaman memorial untuk anggota wafat
- Notifikasi ulang tahun
- Notifikasi haul / tanggal wafat
- Mode publik terbatas
- Mobile app

---

# 13. Recommended MVP Scope

Untuk versi pertama, cukup bangun fitur berikut:

1. Register / login
2. Create family tree
3. Add family member
4. Add parent-child relation
5. Add marriage relation
6. Display tree with Vue Flow
7. Upload photo
8. Basic privacy setting
9. Invite viewer/editor
10. Donation page

Setelah MVP stabil, baru lanjutkan ke export PDF, GEDCOM, audit log detail, dan fitur kolaborasi lanjutan.
