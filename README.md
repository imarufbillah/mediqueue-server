<div align="center">

<img src="./public/logo.svg" alt="MediQueue Logo" width="48" height="48" />

# MediQueue — Server

**The Express.js REST API powering the MediQueue online/offline tutor booking platform**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

<br/>

[🌐 Live API](https://mediqueue-server-sonic.vercel.app) · [💻 Frontend](https://mediqueue-by-marufbillah.vercel.app)

</div>

---

## 📖 Overview

MediQueue Server is the backend REST API for an online/offline tutor booking system. It handles tutor management, session booking operations, and user authentication. Students can browse available tutors, book sessions, and manage their bookings — while tutors can list their availability and manage their profiles. All protected routes use JWT-based authentication via JWKS verification.

---

## 🔗 API Endpoints

| Method   | Route              | Access       | Description                                         |
| -------- | ------------------ | ------------ | --------------------------------------------------- |
| `GET`    | `/`                | 🌐 Public    | Server status check                                 |
| `GET`    | `/tutors`          | 🌐 Public    | Get all tutors (supports search, date range, limit) |
| `GET`    | `/tutors/:id`      | 🔒 Protected | Get a specific tutor by ID                          |
| `POST`   | `/tutors`          | 🔒 Protected | Add a new tutor                                     |
| `GET`    | `/my-tutors`       | 🔒 Protected | Get tutors added by authenticated user              |
| `PATCH`  | `/my-tutors/:id`   | 🔒 Protected | Update user's own tutor                             |
| `DELETE` | `/my-tutors/:id`   | 🔒 Protected | Delete user's own tutor                             |
| `POST`   | `/bookings`        | 🔒 Protected | Create a new booking                                |
| `GET`    | `/my-bookings`     | 🔒 Protected | Get bookings for authenticated user                 |
| `PATCH`  | `/my-bookings/:id` | 🔒 Protected | Cancel a booking                                    |

> 🔒 Protected routes require a valid Bearer token in the `Authorization` header.

---

## ⚙️ Tech Stack

| Technology       | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| **Express.js 5** | Fast, minimal web framework for routing and middleware           |
| **MongoDB**      | NoSQL database for flexible tutor & session booking data storage |
| **jose-cjs**     | JWT verification via remote JWKS endpoint                        |
| **CORS**         | Cross-origin resource sharing for frontend communication         |
| **dotenv**       | Environment variable management                                  |
| **Vercel**       | Serverless deployment with zero-config scaling                   |

---

## 📁 Project Structure

```
mediqueue-server/
├── index.js                  # App bootstrap & route mounting
├── src/
│   ├── config/
│   │   └── db.js             # MongoDB client & database connection
│   ├── middlewares/
│   │   └── auth.js           # JWT/JWKS token validation middleware
│   └── routes/
│       ├── tutors.js         # Public & auth tutor endpoints
│       ├── myTutors.js       # User-owned tutor CRUD operations
│       ├── bookings.js       # Create booking endpoint
│       └── myBookings.js     # User bookings & cancellation
├── .env                      # Environment variables (not committed)
├── package.json
└── vercel.json               # Vercel deployment configuration
```

---

## 🔄 Frontend

This API is consumed by the MediQueue frontend application:

**🌐 [mediqueue-by-marufbillah.vercel.app](https://mediqueue-by-marufbillah.vercel.app)**

---

<div align="center">

**Built with 🩺 for MediQueue — Online Tutor Booking System**

</div>
