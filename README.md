TaskForge

TaskForge is a full-stack collaborative task and study planner built with React(frontend) and FastAPI(backend).  
It is designed to simulate a real-world production workflow, focusing on authentication, security (2FA), REST APIs, and professional GitHub practices.



Features (MVP)

Authentication & Security
- User registration and login
- JWT-based authentication
- Two-Factor Authentication (TOTP using Authenticator apps)
- Secure login flow with password + 2FA code

Projects & Tasks
- Create and manage projects
- Create tasks with:
  - Title
  - Description
  - Due date
  - Priority
  - Status (To-Do / In Progress / Done)
- Role-based access (owner vs collaborator)

Learning-Focused Design
- Real GitHub workflow (branches → PRs → reviews → merge)
- Modular frontend and backend architecture
- CI checks on pull requests



Tech Stack

Frontend
- React
- React Router
- Axios
- Tailwind CSS 

Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL (SQLite for local dev)
- JWT Authentication
- TOTP (pyotp)

DevOps
- Docker 
- GitHub Actions (CI)
- Pytest


Repository Structure

