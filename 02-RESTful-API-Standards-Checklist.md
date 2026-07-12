# RESTful API Standards Checklist
## Stack: Nuxt JS + Drizzle + Zod + Bun + PostgreSQL

Checklist ini memastikan routing API mengikuti standar RESTful API yang umum digunakan secara internasional.

---

# 1. Gunakan Resource Noun, Bukan Verb

✅ Benar:

```http
GET    /users
POST   /users
GET    /users/{id}
PATCH  /users/{id}
DELETE /users/{id}
```

❌ Salah:

```http
GET /get-users
GET /users-all
POST /create-user
POST /update-user
POST /delete-user
```

---

# 2. Gunakan Plural Resource

✅ Benar:

```http
/users
/products
/orders
/categories
```

❌ Salah:

```http
/user
/product
/order
/category
```

---

# 3. HTTP Method Sesuai Aksi

| Action | Method | Endpoint |
|---|---|---|
| List | GET | `/users` |
| Detail | GET | `/users/{id}` |
| Create | POST | `/users` |
| Full Update | PUT | `/users/{id}` |
| Partial Update | PATCH | `/users/{id}` |
| Delete | DELETE | `/users/{id}` |

---

# 4. Hindari Action di URL

✅ Benar:

```http
POST /orders
PATCH /orders/{id}
DELETE /orders/{id}
```

❌ Salah:

```http
POST /create-order
POST /update-order
POST /delete-order
```

Action khusus masih boleh jika bukan CRUD standar:

```http
POST /orders/{id}/cancel
POST /invoices/{id}/pay
POST /users/{id}/verify-email
```

---

# 5. Nested Resource

✅ Benar:

```http
GET /users/{userId}/posts
GET /orders/{orderId}/items
POST /projects/{projectId}/tasks
```

- [ ] Hindari nesting terlalu dalam.
- [ ] Nested resource tetap memeriksa authorization parent resource.
- [ ] Relationship resource jelas.

---

# 6. Filtering

✅ Benar:

```http
GET /users?status=active
GET /products?category=laptop
GET /orders?start_date=2026-01-01
```

❌ Salah:

```http
GET /active-users
GET /laptop-products
GET /orders-by-date
```

---

# 7. Sorting

✅ Benar:

```http
GET /users?sort=name
GET /users?sort=-created_at
GET /products?sort=price
```

- [ ] Sorting menggunakan whitelist kolom.
- [ ] Sorting tidak langsung memasukkan input ke SQL raw.

---

# 8. Pagination

✅ Benar:

```http
GET /users?page=1&per_page=20
GET /products?limit=50&offset=0
```

Response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100
  }
}
```

---

# 9. Search

✅ Benar:

```http
GET /users?search=john
GET /products?q=laptop
```

❌ Salah:

```http
GET /search-users/john
GET /find-product/laptop
```

---

# 10. Status Code

| Status | Keterangan |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

# 11. API Versioning

✅ Benar:

```http
/api/v1/users
/api/v2/users
```

❌ Salah:

```http
/users-v1
/v1-get-users
```

---

# 12. Response Consistency

Sukses:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "message": "Validation failed",
  "errors": {
    "email": ["Email tidak valid"]
  }
}
```

---

# 13. Stack-Specific Routing Notes

- Framework: **Nuxt JS**
- Server layer: **Nitro server API routes**
- Contoh lokasi route: `server/api/users/index.get.ts`
- Validasi request: **Zod**
- Database access: **Drizzle ORM**

- [ ] Route handler tipis.
- [ ] Business logic dipindahkan ke service.
- [ ] Query kompleks dipindahkan ke repository/query module.
- [ ] Error response konsisten.
- [ ] Schema response dipertimbangkan untuk API publik.

---

# Prompt Audit untuk AI

```txt
Lakukan audit RESTful API Standards untuk project ini.

Stack:
- Nuxt JS + Drizzle + Zod + Bun + PostgreSQL
- Runtime: Bun
- Framework: Nuxt JS
- Server layer: Nitro server API routes
- ORM: Drizzle ORM
- Validation: Zod
- Database: PostgreSQL / pgsql

Periksa:
1. Resource naming
2. Plural noun
3. HTTP method
4. URL anti-pattern
5. Nested resource
6. Filtering
7. Sorting
8. Pagination
9. Search
10. Status code
11. Versioning
12. Response consistency
13. Framework-specific route structure

Untuk setiap temuan, berikan:
- Lokasi file/folder/endpoint/config.
- Masalah yang ditemukan.
- Dampak teknis atau risiko bisnis.
- Severity: Critical, High, Medium, Low.
- Rekomendasi perbaikan.
- Contoh kode atau konfigurasi perbaikan jika memungkinkan.

Berikan skor:
- REST Compliance: 0-100
- Routing Consistency: 0-100
- Response Consistency: 0-100
- API Maintainability: 0-100
- Overall Score: 0-100

Prioritaskan temuan yang paling berdampak terhadap keamanan, maintainability, reliability, dan production readiness.
```
