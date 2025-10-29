# Meal Monkey - Restaurant Owner App (Repository)

This repository contains the Restaurant Owner application for Meal Monkey. It includes two primary parts:

- `Backend/` — Node.js/Express backend that powers the restaurant owner APIs (authentication, orders, food management, payments, notifications).
- `restaurent_meal_monkey/` — Flutter frontend app used by restaurant owners (iOS/Android).

This top-level README summarizes each part, how to run them locally, and important security considerations.

## Structure

- `Backend/` — server code, routes, controllers, models, configuration, and a `README.md` with full API and developer instructions.
- `restaurent_meal_monkey/` — Flutter app with its own `README.md` describing app features and how to run the app.

## Quick start

1. Backend

```zsh
cd "Restaurent-App/Backend"
npm install
# create .env from README example or provided template
cp .env.example .env  # if provided
npm run dev
```

2. Flutter frontend

```zsh
cd "Restaurent-App/restaurent_meal_monkey"
flutter pub get
flutter run
```

Refer to `Backend/README.md` and `restaurent_meal_monkey/README.md` for detailed instructions, API docs, and mock data.

## Security note

Sensitive configuration (e.g., `Backend/.env`) must never be committed. If secrets were accidentally pushed, rotate them immediately and consider purging the file from git history using `git-filter-repo` or BFG (this requires a history rewrite and force-push).

## Development tips

- Run the backend and frontend simultaneously during development; the frontend points to backend endpoints (change base URL in config as needed).
- Use environment variables or a secrets manager in production.
- Add pre-commit hooks to prevent accidental commits of `.env` files (husky + lint-staged).

## Where to look next

- Backend API & docs: `Restaurent-App/Backend/README.md`
- Flutter app docs & mock data: `Restaurent-App/restaurent_meal_monkey/README.md`

Last updated: October 30, 2025
