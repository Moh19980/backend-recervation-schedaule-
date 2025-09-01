# 🎓 University Reservation & Scheduling Backend

Backend service for managing **student reservations and scheduling system** in a university environment.  
Built with **Node.js**, **Express**, **Sequelize (ORM for SQL DB)**, and containerized using **Docker**.

---

## 🚀 Features

- 🔑 **User Authentication** (Students, Admins, Faculty)  
- 📅 **Classroom & Exam Scheduling**  
- 📝 **Student Reservations** (labs, tutorials, exam slots, etc.)  
- 📊 **Database Integration** with Sequelize ORM  
- 🐳 **Dockerized Deployment** (ready for production)  
- 📂 **Structured Codebase** (Models, Routes, Migrations, Seeders)  

---

## 🛠 Tech Stack

- **Backend:** Node.js (Express.js)  
- **Database:** MySQL / PostgreSQL (via Sequelize ORM)  
- **Containerization:** Docker & Docker Compose  
- **ORM:** Sequelize (Migrations & Seeders)  
- **Authentication:** JWT-based  

---

## 📂 Project Structure

```bash
backend-recervation-scheadule-/
│── migrations/       # Sequelize migrations
│── models/           # Sequelize models
│── routes/           # Express routes
│── seeders/          # Initial seed data
│── server.js         # App entry point
│── Dockerfile        # Docker build config
│── docker-compose.yml# Compose for services
│── package.json      # Dependencies
│── README.md         # Documentation
