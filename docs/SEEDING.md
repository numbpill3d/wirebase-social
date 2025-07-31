# Secure Seeding Guide

This project supports optional seed scripts for development. Seed users are **not** included by default. To add them, set the environment variables listed in `.env.example` and run:

```bash
node scripts/seed-defaults.js
```

Generate strong passwords for the seed accounts. One approach is using `openssl`:

```bash
openssl rand -base64 32
```

Store the generated values in your `.env` file and keep that file outside of version control.
