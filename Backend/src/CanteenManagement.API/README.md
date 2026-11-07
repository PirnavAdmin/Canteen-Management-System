# Canteen Management System — Backend API
**Module:** Categories & Outlets Backend  
**Lead:** Akshita (Categories Backend)  
**Architecture:** 100% Stored Procedures & Dapper (0% EF Core business CRUD, 0% inline SQL)  
**Framework:** .NET 8 Web API  

---

## 1. Overview
This is the independent backend microservice for the Canteen Management System. It is designed to integrate seamlessly into both **Student Management System (SMS)** and **College Management System (CMS)**.

---

## 2. Project Architecture
```text
CanteenManagement.API/
├── Controllers/V1/
│   └── CanteenCategoriesController.cs    # REST Endpoints for categories
├── DTOs/
│   ├── CanteenCategory/                 # Request & Response contracts
│   └── Common/                          # Generic ApiResponse<T> envelope
├── Data/
│   ├── IDbConnectionFactory.cs          # MySQL Connection Factory
│   └── DbConnectionFactory.cs
├── Database/
│   └── 01_CanteenCategories_Schema_And_SPs.sql  # 100% MySQL Schema & Stored Procedures
├── Models/
│   └── CanteenCategory.cs               # Entity Model
├── Repositories/
│   ├── Interfaces/
│   │   └── ICanteenCategoryRepository.cs
│   └── Implementations/
│       └── CanteenCategoryRepository.cs # Dapper Execution via Stored Procedures
├── Services/
│   ├── Interfaces/
│   │   └── ICanteenCategoryService.cs
│   └── Implementations/
│       └── CanteenCategoryService.cs    # Business Validation & Logic
├── Program.cs                           # DI, Swagger, CORS, Versioning
└── appsettings.json                     # Database connection string
```

---

## 3. Database Setup
1. Open MySQL Workbench / HeidiSQL connected to `localhost:3306`.
2. Run the script located at:
   `Database/01_CanteenCategories_Schema_And_SPs.sql`
   - Creates the `canteen_db` database.
   - Creates the `CanteenCategories` table.
   - Deploys all 6 Stored Procedures (`sp_GetCanteenCategories`, `sp_GetCanteenCategoryById`, `sp_CreateCanteenCategory`, `sp_UpdateCanteenCategory`, `sp_ToggleCanteenCategoryStatus`, `sp_CheckCanteenCategoryNameExists`).
   - Seeds initial categories (`Breakfast`, `Meals & Thali`, `Snacks & Chaat`, `Beverages & Juices`, `Bakery & Desserts`).

---

## 4. Running the Application
1. Update your MySQL password in `appsettings.json`:
   ```json
   "DefaultConnection": "Server=localhost;Port=3306;Database=canteen_db;Uid=root;Pwd=YOUR_PASSWORD;CharacterSubSet=utf8mb4;"
   ```
2. Run the API:
   ```bash
   dotnet run
   ```
3. Open your browser:
   - **Swagger UI:** `http://localhost:5000` or `https://localhost:5001`
   - **Health Check:** `http://localhost:5000/health`

---

## 5. API Endpoints
| HTTP Method | Route | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/canteen-categories` | Get all categories (optional `?isActive=true`) |
| **GET** | `/api/v1/canteen-categories/{id}` | Get single category by ID |
| **POST** | `/api/v1/canteen-categories` | Create a new food category |
| **PUT** | `/api/v1/canteen-categories/{id}` | Update category details & display order |
| **PATCH** | `/api/v1/canteen-categories/{id}/status` | Activate/Deactivate category |
