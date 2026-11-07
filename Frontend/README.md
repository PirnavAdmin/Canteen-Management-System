# Canteen Management & Categories Management System

Integrated Enterprise Frontend Module for Student Management System (SMS) and College Management System (CMS).

Built according to the **Canteen Management System SRS Document (v1.0)**.

---

## 📌 Project Overview

This application delivers the administrative frontend for institutional dining hall operations and menu classifications. Designed specifically for university and college enterprise portals, it provides two primary decoupled modules:

1. **Canteen Management (SRS §3.1 & §10)**: Dining hall and food outlet registration, operating hours, campus mapping, contact details, operating days, order acceptance availability, and staff assignment.
2. **Categories Management (SRS §3.2 & §10)**: Food category classifications, display priority sorting, status control, and historical dependency preservation safeguards.

> **Design Language**: Institutional administration ERP aesthetics with a clean white canvas, deep navy and blue accents, subtle shadows, responsive sidebar navigation, accessible badges, and robust data tables. Not a consumer food delivery app.

---

## 🏗️ Architecture & Folder Structure

Following a **Feature-Based Modular Architecture**:

```
frontend/
  public/
    favicon.svg
  src/
    app/
      App.jsx                     # Root application wrapper with providers
      router.jsx                  # React Router 7 declarative route configuration
      providers/
        AppProviders.jsx          # Composed context providers
        CanteenProvider.jsx       # Canteen state, CRUD, & status handling
        CategoryProvider.jsx      # Category state, CRUD, sorting, & policy guards
        ToastProvider.jsx         # System-wide toast notification dispatcher

    assets/
      images/
      icons/

    components/
      common/
        Breadcrumb.jsx            # Dynamic navigation breadcrumb trail
        Button.jsx                # Primary, Secondary, Danger, and Ghost buttons
        Card.jsx                  # Enterprise card container
        ConfirmationModal.jsx     # Reusable action confirmation dialog
        EmptyState.jsx            # Filter/search fallback state
        NotFoundPage.jsx          # 404 fallback page
        PageHeader.jsx            # Standardized page title, actions, and breadcrumb
        Pagination.jsx            # Table pagination with page size selector
        SearchInput.jsx           # Clean search bar with clear button
        StatCard.jsx              # Summary KPI card
        StatusBadge.jsx           # Active / Inactive status pill
        Toast.jsx                 # Toast notification container
      layout/
        AppLayout.jsx             # Main layout with responsive sidebar & sticky header
        Header.jsx                # User identity, campus badge, and portal indicator
        Sidebar.jsx               # Navigation drawer with Canteen & Category links
      forms/
        FormInput.jsx             # Accessible text/email/phone input with error states
        FormSelect.jsx            # Select dropdown with institutional styling
        FormTextarea.jsx          # Multi-line input for notes and descriptions
        TimeInput.jsx             # 24-hr time picker with 12-hr AM/PM preview
        WorkingDaysSelector.jsx   # Multi-day selector with Mon-Fri / 7-Day presets
      tables/
        DataTable.jsx             # Reusable table with column sorting and empty states
      modals/
        Modal.jsx                 # Accessible dialog with ESC listener and backdrop

    modules/
      canteen/
        pages/
          CanteenListPage.jsx     # Screen 1: Listing, filters, search, & pagination
          AddCanteenPage.jsx      # Screen 2: Canteen registration form
          EditCanteenPage.jsx     # Screen 3: Prepopulated edit form
          CanteenDetailsPage.jsx  # Screen 4: Full outlet specifications & staff cards
        components/
          CanteenFilters.jsx      # Search, campus filter, status filter, reset
          CanteenForm.jsx         # Reusable form component with validations
          CanteenStaffCard.jsx    # Outlet administrator and operational staff manager
          CanteenSummaryCards.jsx # Top KPI cards (Total, Active, Campuses, Hours)
          CanteenTable.jsx        # Data table for canteens
        hooks/
          useCanteens.js          # Custom hook to access canteen actions & state
        services/
          canteenService.js       # Asynchronous data service with localStorage caching
        constants/
          canteenConstants.js     # Campuses, days of week, seed data
        utils/
          canteenValidators.js    # Canteen form validation rules
          canteenFormatters.js    # Time, days, and duration formatting helpers
        index.js

      categories/
        pages/
          CategoryListPage.jsx    # Screen 5: Category listing with column sorting
          AddCategoryPage.jsx     # Screen 6: Category creation form
          EditCategoryPage.jsx    # Screen 7: Prepopulated edit form
          CategoryDetailsPage.jsx # Screen 8: Category details & dependency cards
        components/
          CategoryFilters.jsx     # Search and status filter
          CategoryForm.jsx        # Reusable form with validations & policy banner
          CategorySummaryCards.jsx# KPI cards (Total, Active, Linked Items, Rank)
          CategoryTable.jsx       # Sortable category table
        hooks/
          useCategories.js        # Custom hook to access category actions & state
        services/
          categoryService.js      # Data service with Section 3.2 policy checks
        constants/
          categoryConstants.js    # Status constants and seed categories
        utils/
          categoryValidators.js   # Category name and display order validators
          categoryFormatters.js   # Formatting helpers
        index.js

    services/
      storageService.js           # Isolated browser storage abstraction
    hooks/
      useToast.js                 # Global toast hook
    utils/
      formatters.js               # Common date/time formatters
    constants/
      navigation.js               # Navigation menu items & institutional config
    styles/
      variables.css               # Design tokens (colors, shadows, typography)
      global.css                  # CSS reset, utilities, and base styles
      layout.module.css           # Modular layout and sidebar styling

    main.jsx                      # Vite application entry point

  .env.example                    # Environment variable template
  .gitignore
  index.html                      # HTML template with Inter font
  package.json                    # Project configuration
  README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or newer recommended, verified on v24)
- npm or pnpm

### Installation

```bash
# Clone or navigate to the directory
cd frontend

# Install dependencies
npm install
```

### Development Server

Start Vite local development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

Create an optimized production bundle:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## 📋 Module Specifications & Implemented Screens

### Module 1: Canteen Management

| Screen | Route | Description |
|---|---|---|
| **SCREEN 1: Canteen Listing** | `/canteen` | Complete data table with search, campus filter, status filter, summary KPI cards, pagination, and quick status toggle. |
| **SCREEN 2: Add Canteen** | `/canteen/create` | Registration form with Name, Code, Campus, Location, Contact, Operating Hours, Working Days, Status, and Order Acceptance. |
| **SCREEN 3: Edit Canteen** | `/canteen/:id/edit` | Reuses the form component with prepopulated records and validation. |
| **SCREEN 4: Canteen Details** | `/canteen/:id` | Professional overview card, operating hours, working days, and Staff Assignment management (SRS §3.1). |

### Module 2: Categories Management

| Screen | Route | Description |
|---|---|---|
| **SCREEN 5: Category Listing** | `/categories` | Data table with live search, status filter, interactive column sorting (Display Order, Name, Status), and pagination. |
| **SCREEN 6: Add Category** | `/categories/create` | Creation form with Category Name, Display Order rank, Status, and Description. |
| **SCREEN 7: Edit Category** | `/categories/:id/edit` | Prepopulated edit form with uniqueness and positive integer order validations. |
| **SCREEN 8: Category Details** | `/categories/:id` | Detailed card with rank, description, and SRS §3.2 Institutional Policy Notice. |

---

## ⚖️ Key Business Rules & Validations

1. **Category Deletion Safeguard (SRS §3.2 & §6.2)**:
   - Categories that have historical menu items or order records mapped to them cannot be permanently deleted.
   - The application enforces deactivation instead, preventing broken historical order slips and preserving financial reconciliation data.

2. **Canteen Code Uniqueness**:
   - Canteen codes must be uppercase alphanumeric (e.g., `CNT-MAIN-01`) and unique across the institution.

3. **Operating Schedule Logic**:
   - Canteen closing time must chronologically succeed opening time.
   - At least one working day must be selected.

4. **Order Acceptance Availability (SRS §3.1)**:
   - Outlets can toggle order acceptance on/off independently from general active status.

---

## 🛡️ Future Backend Integration

All API calls are decoupled inside `src/modules/canteen/services/canteenService.js` and `src/modules/categories/services/categoryService.js`. The signatures match the proposed REST API catalog from Section 7 of the SRS (`/api/canteens`, `/api/canteen-categories`). Replacing the local storage layer with live `fetch` or `axios` calls requires changes only inside these service files.
