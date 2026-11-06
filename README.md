# Shopping List App

A simple shopping list web app built with Node.js, Express, and MongoDB (Mongoose).

- Add items (name, quantity, category) and save them to MongoDB
- Retrieve items from MongoDB, filter by to-buy / purchased
- Tick items off, delete them, or clear everything you've purchased

## Requirements

- Node.js 18 or newer
- A MongoDB database: local install, Docker, or a free MongoDB Atlas cluster

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Open `.env` and set `MONGODB_URI`:

   - Local MongoDB: `mongodb://127.0.0.1:27017/shopping_list`
   - Atlas: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/shopping_list?retryWrites=true&w=majority`
     (in Atlas, also allow your IP under Network Access)

3. Start the app:

   ```bash
   npm start
   ```

4. Open http://localhost:3000

No local MongoDB? Run one with Docker:

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | App and database connection status |
| GET | `/api/items` | List items (`?purchased=true\|false`, `?category=Dairy`) |
| GET | `/api/items/:id` | Get one item |
| POST | `/api/items` | Add an item `{ name, quantity, category }` |
| PUT | `/api/items/:id` | Update `name`, `quantity`, `category`, `purchased` |
| DELETE | `/api/items/:id` | Delete an item |
| DELETE | `/api/items` | Delete all purchased items |

## Project structure

```
shopping-list-app/
├── server.js        Express server + Mongoose model + API routes
├── package.json
├── .env.example     Copy to .env and set MONGODB_URI
└── public/          Frontend (index.html, style.css, app.js)
```
