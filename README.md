# Kanban Board — Backend API

Express.js + MongoDB REST API. Barcha CRUD va order featurelari mavjud.

## Setup

```bash
npm install
cp .env.example .env   # MONGO_URI ni to'ldiring
npm run dev
```

---

## Data Models

### Column
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto |
| `name` | String | Column nomi |
| `order` | Number | Tartib raqami (1 dan boshlanadi) |
| `count` | Virtual | Task soni |
| `tasks` | Virtual | Populate qilinadi |

### Task
| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Auto |
| `title` | String | Task sarlavhasi |
| `description` | String | Qo'shimcha ma'lumot |
| `column_id` | ObjectId | Ref: Column |
| `order` | Number | Column ichidagi tartib |

---

## API Endpoints

### COLUMNS

#### GET /api/columns
Barcha columnlarni order bo'yicha qaytaradi, har birida task count bor.

**Response:**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "IN PROGRESS", "order": 1, "count": 2 },
    { "_id": "...", "name": "DONE", "order": 2, "count": 3 }
  ]
}
```

---

#### GET /api/columns/:id
Column + uning barcha tasklari (order bo'yicha).

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "JS",
    "order": 3,
    "count": 3,
    "tasks": [
      { "_id": "...", "title": "Classwork", "order": 1 },
      { "_id": "...", "title": "Homework", "order": 2 }
    ]
  }
}
```

---

#### POST /api/columns
Yangi column yaratish. `order` avtomatik tayinlanadi (oxirgi + 1).

**Body:**
```json
{ "name": "REVIEW" }
```

---

#### PUT /api/columns/:id
Column nomini yangilash.

**Body:**
```json
{ "name": "IN REVIEW" }
```

---

#### DELETE /api/columns/:id
Columnni va uning barcha tasklarini o'chiradi.
Keyingi columnlarning `order` i avtomatik kamaytiradi.

---

#### PATCH /api/columns/:id/move
Columnni chapga yoki o'ngga siljitish (qo'shni bilan tartibini almashtiradi).

**Body:**
```json
{ "direction": "left" }
{ "direction": "right" }
```

---

#### PATCH /api/columns/reorder
Drag & drop uchun bulk reorder.

**Body:**
```json
{
  "orders": [
    { "id": "col_id_1", "order": 1 },
    { "id": "col_id_2", "order": 2 },
    { "id": "col_id_3", "order": 3 }
  ]
}
```

---

### TASKS

#### GET /api/tasks
Barcha tasklarni qaytaradi. Column bo'yicha filterlash mumkin.

**Query params:**
- `?column_id=<id>` — faqat shu columndagi tasklar

---

#### GET /api/tasks/:id
Bitta task, column ma'lumoti bilan.

---

#### POST /api/tasks
Yangi task. `order` avtomatik (column ichida oxirgi + 1).

**Body:**
```json
{
  "title": "New task",
  "description": "optional",
  "column_id": "<column_id>"
}
```

---

#### PUT /api/tasks/:id
Taskni yangilash. Column o'zgartirilsa yoki order o'zgartirilsa,
qolgan tasklarning orderlari avtomatik shift qilinadi.

**Body (barchasi optional):**
```json
{
  "title": "Updated title",
  "description": "Updated desc",
  "column_id": "<new_column_id>",
  "order": 2
}
```

**Order shift logikasi:**
- Xuddi shu column ichida: oraliq tasklar +1 yoki -1 siljiydi
- Boshqa columnga ko'chirish: eski columndan chiqariladi (shift -1), yangi columnda joyiga kiritiladi (shift +1)

---

#### DELETE /api/tasks/:id
Taskni o'chiradi. Shu columndagi keyingi tasklarning orderi -1 kamaytiradi.

---

#### PATCH /api/tasks/:id
Taskni reorder qilish (faqat bitta taskni id si bo'yicha siljitish). Boshqa tasklar avtomatik tarzda pastga yoki tepaga siljiydi (order shift).

**Body:**
```json
{
  "column_id": "col_id_1",
  "order": 2
}
```

---

## Error Response Format

```json
{
  "success": false,
  "message": "Task not found"
}
```

Validation xatosi:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    { "field": "title", "message": "title is required" }
  ]
}
```

---

## Project Structure

```
kanban-backend/
├── config/
│   └── db.js                  # MongoDB connection
├── src/
│   ├── models/
│   │   ├── Column.js           # Column schema + virtuals
│   │   └── Task.js             # Task schema + indexes
│   ├── controllers/
│   │   ├── columnController.js # 7 ta action
│   │   └── taskController.js   # 7 ta action
│   ├── routes/
│   │   ├── columnRoutes.js
│   │   └── taskRoutes.js
│   ├── middleware/
│   │   ├── validate.js         # express-validator errors
│   │   └── errorHandler.js     # Global error handler
│   └── index.js               # Express app entry
├── .env.example
└── package.json
```
