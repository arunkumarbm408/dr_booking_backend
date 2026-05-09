# Library Management API

A simple RESTful API for managing authors and books. Built with **Node.js**, **Express.js**, and **MongoDB**.  
Supports creating authors, adding books, and fetching books with author details.

---

## Features

- Create and manage authors
- Create and manage books
- Associate books with authors
- Prevent duplicate books for the same author
- Fetch books along with author details
- Validation with **Joi**
- Swagger documentation

---


## Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd library-management-api

npm install

.env    
PORT=5000
mongodb_uri=mongodb://127.0.0.1:27017/library_management
app_version=1.0
swagger_host_url=localhost:5000
NODE_ENV=development
SWAGGER_USER=admin
SWAGGER_PASSWORD=admin

npm run dev
