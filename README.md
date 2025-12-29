# Cooklio - Recipe Management Application

A full-stack application with user authentication, built with Next.js, Fastify, PostgreSQL, and Redis.

## Features

- User registration with email verification
- User login with JWT authentication
- Password reset functionality
- 4-digit verification codes for email verification and password reset
- Redis caching for improved performance
- Secure password handling with bcrypt

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Backend**: Fastify API server
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT tokens
- **Password Hashing**: bcrypt

## Project Structure

```
cooklio-app/
├── api/                    # Fastify API server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── database/       # DB connection and Redis
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── types/          # TypeScript types
│   └── ...
└── client/                 # Next.js frontend
    ├── app/                # App Router pages
    │   ├── login/          # Login page
    │   ├── register/       # Registration page
    │   ├── forgot-password/ # Forgot password page
    │   ├── reset-password/ # Reset password page
    │   └── verify/         # Email verification page
    └── ...
```

## Setup Instructions

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL
- Redis

### Backend Setup

1. Navigate to the API directory:
```bash
cd cooklio-app/api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example .env and update values as needed
cp .env .env.local
```

4. Initialize the database:
```bash
npm run init-db
```

5. Start the API server:
```bash
npm run dev
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd cooklio-app/client
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example .env and update values as needed
cp .env.local .env.local
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/verify` - Verify email with code
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with code
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user

## Environment Variables

### API (.env)

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=cooklio
DB_PASSWORD=cooklio
DB_NAME=cooklio

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-in-production

# Email Configuration (for nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Application Configuration
PORT=8000
CLIENT_URL=http://localhost:3000
```

### Client (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Database Schema

The application uses the following tables:

- `users` - Stores user information
- `refresh_tokens` - Stores refresh tokens for session management

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Email verification required for new accounts
- Rate limiting and input validation
- SQL injection prevention through parameterized queries

## Testing

To run the authentication flow test:

```bash
cd cooklio-app/api
npx tsx test.ts
```

## Deployment

For production deployment:

1. Update environment variables with production values
2. Set up SSL certificates
3. Configure a reverse proxy (nginx)
4. Set up a process manager (pm2) for the API server
5. Build the Next.js application for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[MIT](LICENSE)