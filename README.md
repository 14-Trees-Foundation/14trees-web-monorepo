## Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Development](#development)
  - [Building](#building)
- [Configuration](#configuration)
- [Packages](#packages)


## Project Structure

The project consists of the following main directories:

- `apps/`: Contains individual applications within the project.
  - `admin/`: Admin application.
  - `admin-next/`: Next.js-based admin application.
  - `api/`: API application.
  - `dashboard/`: Dashboard application.
  - `dashboard-next/`: Next.js-based dashboard application.
  - `front-page/`: Front-page application.
- `db/`: Contains database-related files and scripts.
- `packages/`: Contains shared packages used across applications.
  - `contentful-fetch/`: Package for fetching data from Contentful.
  - `eslint-config-custom/`: Custom ESLint configuration package.
  - `notion-sync/`: Package for syncing data with Notion.
  - `schema/`: Package for defining data schemas.
  - `tsconfig/`: Shared TypeScript configuration package.
  - `ui/`: UI component library package.

## Getting Started

### Prerequisites

- Node.js (version >= 18)
- Yarn package manager

### Installation

1. Clone the repository:
   ```
   git clone git@github.com:14-Trees-Foundation/14trees-web-monorepo.git
   ```

2. Install dependencies:
   ```
   cd 14trees-web-monorepo
   yarn install
   ```

## Usage

### Development
Start the local database
```
docker compose up -d
```

To start the development server for all apps, run:
```
yarn dev
```

To start development server for only a specific submodule, run:
```
yarn dev --filter=front-page
```

### Building

To build all apps for production, run:
```
yarn build
```

...or for a specific module: 
```
yarn build --filter=front-page
```

## Configuration

The project uses environment variables for configuration. The following environment variables are used:

- `NODE_ENV`: Node environment (e.g., `development`, `production`).
- `NEXT_PUBLIC_API_URL`: URL for the API.
- `SERVER_PORT`: Port number for the server.
- `NEXT_PUBLIC_RAZORPAY_KEY`: Razorpay API key.
- `NOTION_API_KEY`: Notion API key.
- `CONTENTFUL_SPACE_ID`: Contentful space ID.
- `CONTENTFUL_ACCESS_TOKEN`: Contentful access token.
- `CONTENTFUL_PREVIEW_ACCESS_TOKEN`: Contentful preview access token.

Make sure to set these environment variables in the appropriate `.env` files.

## Packages

The project includes several custom packages in the `packages/` directory. These packages provide shared functionality and configurations across the applications.

### Utilities

This Turborepo has some additional tools already setup for you:

- [Tailwind CSS](https://tailwindcss.com/) for styles
- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Zod](https://zod.dev/) for typed schemas
- [Shadcn UI](https://ui.shadcn.com/) - UI interactions with Tailwind Support
