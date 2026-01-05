# Perfume Store – Full-Stack E-Commerce System

A full-stack e-commerce platform designed to support complete **user shopping workflows**
and **admin management operations**, including product management, order lifecycle
control, and integrated online payments.

The system is built with a scalable architecture separating **user-facing applications**
and **admin management systems**, ensuring security, maintainability, and performance.

---

## Project Overview

This project implements a **secure and scalable e-commerce solution** that covers the
entire business flow:

- Product browsing → Cart → Checkout → Payment
- Order creation → Admin approval/cancellation → Order completion
- Role-based access control for users and administrators
- Integrated online payment gateway and COD support

The architecture separates concerns across multiple frontend and backend services to
support future expansion and independent deployment.

---

## Architecture

- **Frontends (2)**
  - User Web Application (Customer-facing UI)
  - Admin Dashboard (Management & Monitoring)

- **Backends (2)**
  - User API Service (Authentication, orders, payments)
  - Admin API Service (Product, category, order approval, statistics)

- **Database**
  - Centralized MySQL database with relational schema and validations

---

## 🚀 Language and Tools

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![SMTP](https://img.shields.io/badge/SMTP-FF6C37?style=for-the-badge&logo=gmail&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

---

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

### DevOps & Tools
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![PNPM](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-0466C8?style=for-the-badge&logo=render&logoColor=white)


---

## Main Features

### User Features
- Product browsing, searching, and filtering
- User authentication (Register / Login)
- Profile & address management
- Shopping cart management
- Order placement and cancellation
- Checkout with **COD** and **online payment**
- Order status tracking

### Admin Features
- Category & product CRUD operations
- Order approval and cancellation workflow
- Order lifecycle management
- Dashboard statistics and system overview
- Role-based access to admin resources

---

## Database Design

- Designed and optimized a relational MySQL schema including:
  - Users
  - Roles
  - Products
  - Categories
  - Orders
  - Order Items
  - Payments
- Enforced data consistency with relationships, constraints, and validations
- Optimized queries to support admin dashboards and order statistics

---

## Security & Code Quality

- JWT-based authentication
- Role-based authorization for protected routes
- Centralized error handling
- Validation at API and database levels
- Focus on maintainable, modular backend structure
- Prepared architecture for future unit testing and scalability

---

## Brief Summary

Built a **secure, scalable full-stack e-commerce system** supporting complete user and
admin workflows. The project focuses on **performance**, **data consistency**, and a
**seamless user experience**, from product browsing to order approval and payment
processing.

This project demonstrates **end-to-end order lifecycle management**, integrated online
payment handling, and real-world admin approval processes.

---

## Images
1. Database

<img width="1002" height="758" alt="image" src="https://github.com/user-attachments/assets/fccd41b6-1179-438d-81c9-649c8f38eaad" />


---

## Repository

GitHub:  
👉 https://github.com/duclong27/Perfume-store
