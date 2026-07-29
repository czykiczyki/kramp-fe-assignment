# Webshop

> [!IMPORTANT]
> For assignment instructions please read [ASSIGNMENT.md](./ASSIGNMENT.md)

## Getting Started

### Prerequisites

- Node.js 24+
- npm

### Installation

```bash
npm install
```

### Running the Application

To run both the frontend and backend:

```bash
npm run dev
```

By default the webshop talks to the GraphQL API at `http://localhost:4000/graphql`. To point it at a different address, copy `apps/webshop/.env.local.example` to `apps/webshop/.env.local` and set `NEXT_PUBLIC_GRAPHQL_URL`.

### Running Tests

```bash
npx nx test webshop
```

### Optional: To run Storybook

```bash
npm run storybook
```
