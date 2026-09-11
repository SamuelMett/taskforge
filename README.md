TaskForge

TaskForge is a full-stack collaborative task and study planner built with React(frontend) and FastAPI(backend).  
It is designed to simulate a real-world production workflow, focusing on authentication, security (2FA), REST APIs, and professional GitHub practices.



Features

Authentication & Security
- User registration and login
- JWT-based authentication
- Two-Factor Authentication (TOTP using Authenticator apps)
- Secure login flow with password + 2FA code
- Rate limiting on login/2FA endpoints

Tasks
- Create tasks with:
  - Title
  - Description
  - Due date
  - Priority
  - Status (To-Do / In Progress / Done)

Learning-Focused Design
- Modular frontend and backend architecture



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


Roadmap (not built yet)
- Projects, with role-based access (owner vs collaborator)
- Password reset / account recovery flow
- Automated tests (Pytest)
- CI checks on pull requests (GitHub Actions)
- Docker
- Real GitHub workflow (branches → PRs → reviews → merge)


Repository Structure

