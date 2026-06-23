# Kanban Backend API Docs

Frontend integratsiya uchun qisqa va amaliy API hujjat.

## Base URL

Development:

```text
http://localhost:5000
```

Production:

```text
http://13.50.4.81:5000
```

Swagger UI:

```text
GET /api-docs
```

Health check:

```http
GET /api/health
```

Response:

```json
{
  "success": true,
  "message": "Kanban API running",
  "timestamp": "2026-06-19T00:00:00.000Z"
}
```

## Authentication

Protected endpointlar `x-api-key` header talab qiladi.

```http
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

Himoyalangan endpointlar:

- `/api/users`
- `/api/columns`
- `/api/tasks`

Admin API key `.env` dagi `ADMIN_API_KEY` bilan tekshiriladi. Oddiy user API key esa user yaratilganda backend tomonidan generate qilinadi.

Unauthorized response:

```json
{
  "success": false,
  "message": "Authentication required. Missing x-api-key header."
}
```

Invalid key response:

```json
{
  "success": false,
  "message": "Invalid API key."
}
```

## Common Response Formats

Single item:

```json
{
  "success": true,
  "data": {}
}
```

List with pagination:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Task not found or unauthorized"
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "title",
      "message": "title is required"
    }
  ]
}
```

## Data Models

### User

```ts
type User = {
  id: string;
  name: string;
  apiKey: string;
  role: "user";
  createdAt: string;
  updatedAt: string;
};
```

### Column

```ts
type Column = {
  id: string;
  name: string;
  user_id: string;
  order: number;
  count?: number;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
};
```

### Task

`column_id` ba'zi response larda string, ba'zi response larda populated object bo'lishi mumkin.

```ts
type Task = {
  id: string;
  title: string;
  description: string;
  column_id: string | {
    id: string;
    name: string;
  };
  user_id: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};
```

## Query Parameters

List endpointlarda pagination ishlatiladi:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | number | `1` | Sahifa raqami |
| `limit` | number | `10` | Bitta sahifadagi itemlar soni |
| `search` | string | - | Search filter |

Tasks uchun optional filter:

| Param | Type | Description |
| --- | --- | --- |
| `column_id` | MongoId | Faqat kerak bo'lsa, tasklarni bitta column bo'yicha filter qiladi. All tasks uchun yuborilmaydi |

## Users

Users endpointlari faqat admin uchun.

### Get Users

```http
GET /api/users?page=1&limit=10&search=ali
```

Headers:

```http
x-api-key: ADMIN_API_KEY
```

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "name": "Ali",
      "apiKey": "generated-api-key",
      "role": "user",
      "createdAt": "2026-06-19T00:00:00.000Z",
      "updatedAt": "2026-06-19T00:00:00.000Z",
      "id": "667000000000000000000001"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Create User

```http
POST /api/users
```

Headers:

```http
x-api-key: ADMIN_API_KEY
Content-Type: application/json
```

Body:

```json
{
  "name": "Ali"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "name": "Ali",
    "apiKey": "generated-api-key",
    "role": "user",
    "createdAt": "2026-06-19T00:00:00.000Z",
    "updatedAt": "2026-06-19T00:00:00.000Z",
    "id": "667000000000000000000001"
  }
}
```

## Columns

Columns oddiy user uchun faqat o'ziga tegishli data bilan ishlaydi. Admin hamma columnlarni ko'ra oladi.

### Get Columns

```http
GET /api/columns?page=1&limit=10&search=todo
```

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "name": "TODO",
      "user_id": "667000000000000000000001",
      "order": 1,
      "count": 3,
      "createdAt": "2026-06-19T00:00:00.000Z",
      "updatedAt": "2026-06-19T00:00:00.000Z",
      "id": "667000000000000000000101"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Get Column By ID

```http
GET /api/columns/:id
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "name": "TODO",
    "user_id": "667000000000000000000001",
    "order": 1,
    "tasks": [
      {
        "title": "Create UI",
        "description": "Build board page",
        "column_id": "667000000000000000000101",
        "user_id": "667000000000000000000001",
        "order": 1,
        "createdAt": "2026-06-19T00:00:00.000Z",
        "updatedAt": "2026-06-19T00:00:00.000Z",
        "id": "667000000000000000000201"
      }
    ],
    "count": 1,
    "createdAt": "2026-06-19T00:00:00.000Z",
    "updatedAt": "2026-06-19T00:00:00.000Z",
    "id": "667000000000000000000101"
  }
}
```

### Create Column

```http
POST /api/columns
```

Body for user API key:

```json
{
  "name": "IN PROGRESS"
}
```

Body for admin API key:

```json
{
  "name": "IN PROGRESS",
  "user_id": "667000000000000000000001"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "name": "IN PROGRESS",
    "user_id": "667000000000000000000001",
    "order": 2,
    "createdAt": "2026-06-19T00:00:00.000Z",
    "updatedAt": "2026-06-19T00:00:00.000Z",
    "id": "667000000000000000000102"
  }
}
```

Notes:

- `order` avtomatik: userning oxirgi column orderi + 1.
- Admin column yaratishda `user_id` yuborishi shart.

### Update Column

```http
PUT /api/columns/:id
```

Body:

```json
{
  "name": "REVIEW"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "name": "REVIEW",
    "user_id": "667000000000000000000001",
    "order": 2,
    "count": 0,
    "createdAt": "2026-06-19T00:00:00.000Z",
    "updatedAt": "2026-06-19T00:00:00.000Z",
    "id": "667000000000000000000102"
  }
}
```

### Delete Column

```http
DELETE /api/columns/:id
```

Response `200`:

```json
{
  "success": true,
  "message": "Column and its tasks deleted"
}
```

Notes:

- Column o'chirilganda ichidagi tasklar ham o'chadi.
- Keyingi columnlarning `order` qiymati avtomatik `-1` bo'ladi.

### Move Column

```http
PATCH /api/columns/:id/move
```

Body:

```json
{
  "direction": "left"
}
```

Allowed values:

- `left`
- `right`

Response `200`:

```json
{
  "success": true,
  "data": {
    "moved": {
      "id": "667000000000000000000102",
      "name": "REVIEW",
      "order": 1
    },
    "swapped": {
      "id": "667000000000000000000101",
      "name": "TODO",
      "order": 2
    }
  }
}
```

## Tasks

Tasks oddiy user uchun faqat o'ziga tegishli data bilan ishlaydi. Admin hamma tasklarni ko'ra oladi.

### Get Tasks

```http
GET /api/tasks?page=1&limit=100&search=ui
```

Response `200`:

```json
{
  "success": true,
  "data": [
    {
      "title": "Create UI",
      "description": "Build board page",
      "column_id": {
        "name": "TODO",
        "id": "667000000000000000000101"
      },
      "user_id": "667000000000000000000001",
      "order": 1,
      "createdAt": "2026-06-19T00:00:00.000Z",
      "updatedAt": "2026-06-19T00:00:00.000Z",
      "id": "667000000000000000000201"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Get Task By ID

```http
GET /api/tasks/:id
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "title": "Create UI",
    "description": "Build board page",
    "column_id": {
      "name": "TODO",
      "id": "667000000000000000000101"
    },
    "user_id": "667000000000000000000001",
    "order": 1,
    "createdAt": "2026-06-19T00:00:00.000Z",
    "updatedAt": "2026-06-19T00:00:00.000Z",
    "id": "667000000000000000000201"
  }
}
```

### Create Task

```http
POST /api/tasks
```

Body:

```json
{
  "title": "Create UI",
  "description": "Build board page",
  "column_id": "667000000000000000000101"
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "title": "Create UI",
    "description": "Build board page",
    "column_id": {
      "name": "TODO",
      "id": "667000000000000000000101"
    },
    "user_id": "667000000000000000000001",
    "order": 1,
    "createdAt": "2026-06-19T00:00:00.000Z",
    "updatedAt": "2026-06-19T00:00:00.000Z",
    "id": "667000000000000000000201"
  }
}
```

Notes:

- `title` required.
- `column_id` valid MongoId bo'lishi kerak.
- `description` optional.
- `order` avtomatik: column ichidagi oxirgi task orderi + 1.

### Update Task

```http
PUT /api/tasks/:id
```

Body fields hammasi optional:

```json
{
  "title": "Updated UI",
  "description": "Updated description",
  "column_id": "667000000000000000000102",
  "order": 2
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "title": "Updated UI",
    "description": "Updated description",
    "column_id": {
      "name": "REVIEW",
      "id": "667000000000000000000102"
    },
    "user_id": "667000000000000000000001",
    "order": 2,
    "createdAt": "2026-06-19T00:00:00.000Z",
    "updatedAt": "2026-06-19T00:00:00.000Z",
    "id": "667000000000000000000201"
  }
}
```

Notes:

- Agar `column_id` o'zgarsa, task yangi columnga ko'chadi.
- Agar `order` yuborilsa, backend boshqa tasklarning orderini shift qiladi.
- Agar yangi `column_id` yuborilib `order` yuborilmasa, task target column oxiriga qo'shiladi.

### Reorder Task

Drag and drop uchun tavsiya qilingan endpoint.

```http
PATCH /api/tasks/:id
```

Body:

```json
{
  "column_id": "667000000000000000000102",
  "order": 1
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Task position updated successfully",
  "data": {
    "title": "Create UI",
    "description": "Build board page",
    "column_id": {
      "name": "REVIEW",
      "id": "667000000000000000000102"
    },
    "user_id": "667000000000000000000001",
    "order": 1,
    "createdAt": "2026-06-19T00:00:00.000Z",
    "updatedAt": "2026-06-19T00:00:00.000Z",
    "id": "667000000000000000000201"
  }
}
```

Notes:

- `order` required va `1` dan katta yoki teng integer bo'lishi kerak.
- `column_id` required va valid MongoId bo'lishi kerak.
- Same column ichida reorder qilsa, oraliq tasklar avtomatik siljiydi.
- Boshqa columnga ko'chirsa, eski column va yangi column orderlari avtomatik yangilanadi.

### Delete Task

```http
DELETE /api/tasks/:id
```

Response `200`:

```json
{
  "success": true,
  "message": "Task deleted"
}
```

Notes:

- Task o'chirilganda shu columndagi keyingi tasklarning `order` qiymati avtomatik `-1` bo'ladi.

## Status Codes

| Code | Meaning |
| --- | --- |
| `200` | Success |
| `201` | Created |
| `400` | Validation yoki bad request |
| `401` | API key yo'q yoki invalid |
| `403` | Admin-only endpoint uchun ruxsat yo'q |
| `404` | Resource topilmadi yoki userga tegishli emas |
| `409` | Duplicate value |
| `500` | Server error |

## Frontend Integration Notes

### Axios client

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

export function setApiKey(apiKey: string) {
  api.defaults.headers.common["x-api-key"] = apiKey;
}
```

### Recommended board load flow

1. User API key ni frontend state/localStorage dan oling.
2. `GET /api/columns?limit=100` orqali columnlarni oling.
3. `GET /api/tasks?limit=100` orqali barcha tasklarni bitta request bilan oling.
4. Frontendda tasklarni `column_id.id` yoki `column_id` bo'yicha group qilib columnlarga joylang.
5. Drag and drop task move uchun `PATCH /api/tasks/:id` ishlating.
6. Column move uchun `PATCH /api/columns/:id/move` ishlating.

### Example service functions

```ts
export async function getColumns() {
  const res = await api.get("/api/columns", { params: { limit: 100 } });
  return res.data;
}

export async function getTasks() {
  const res = await api.get("/api/tasks", { params: { limit: 100 } });
  return res.data;
}

export async function createColumn(name: string, userId?: string) {
  const body = userId ? { name, user_id: userId } : { name };
  const res = await api.post("/api/columns", body);
  return res.data;
}

export async function createTask(input: {
  title: string;
  description?: string;
  column_id: string;
}) {
  const res = await api.post("/api/tasks", input);
  return res.data;
}

export async function moveTask(taskId: string, columnId: string, order: number) {
  const res = await api.patch(`/api/tasks/${taskId}`, {
    column_id: columnId,
    order,
  });
  return res.data;
}

export async function moveColumn(columnId: string, direction: "left" | "right") {
  const res = await api.patch(`/api/columns/${columnId}/move`, { direction });
  return res.data;
}
```

## Important Validation Rules

| Field | Rule |
| --- | --- |
| `id` path params | Valid MongoId |
| `column_id` | Valid MongoId |
| `title` | Required on create, cannot be empty on update, max 200 chars |
| `description` | Optional, max 2000 chars |
| `name` | Required for columns, max 100 chars |
| `order` | Positive integer, minimum `1` |
| `direction` | `left` yoki `right` |

## Known Backend Behavior

- MongoDB `_id` response dan olib tashlanadi, frontend `id` field ishlatishi kerak.
- `GET /api/tasks`, `GET /api/tasks/:id`, `POST /api/tasks`, `PUT /api/tasks/:id`, `PATCH /api/tasks/:id` response larida `column_id` populated object bo'lishi mumkin.
- `GET /api/columns/:id` response ichidagi `tasks[].column_id` odatda string ObjectId bo'ladi.
- List endpointlarda default `limit` 10, shuning uchun board uchun odatda `limit=100` yuborish qulay.
- Hozirgi backendda bulk column reorder endpoint yo'q. Mavjud endpoint: `PATCH /api/columns/:id/move`.
