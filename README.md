
# SkillMate

### Connect Students. Exchange Skills. Learn Together. Grow Together.

SkillMate is an AI-assisted, college-first peer learning platform that connects students who want to exchange knowledge and learn new skills from one another.

The platform encourages collaborative learning by allowing students to teach the skills they know and learn from peers who have different areas of expertise.

## Features

### 1. Student Authentication
- Student registration and login.
- Secure password hashing.
- JWT-based authentication.

### 2. Student Profiles
- Manage student profiles.
- Add college, department and year information.
- Add skills students can teach and skills they want to learn.

### 3. Skill Matching
- Discover students based on skill compatibility.
- Find peers who can teach desired skills.
- Explore peer learning opportunities.

### 4. Connections and Communication
- Send and manage connection requests.
- Real-time messaging using Socket.IO.
- Notifications for platform activities.

### 5. Learning Sessions
- Manage student availability.
- Schedule and manage learning sessions.
- Support online learning meetings.
- Classroom functionality.

### 6. Skill Assessments
- Topic-based skill assessments.
- Multiple-choice questions.
- Beginner, intermediate and advanced difficulty levels.
- AI-assisted question generation using Google Gemini.
- Assessment scoring and validation.
- Reassessment and proficiency tracking.

### 7. Learning Progress
- Track learning activities.
- Monitor completed learning sessions.
- View learning progress and skill proficiency.

### 8. Feedback
- Submit feedback after learning sessions.
- Encourage improvement through peer feedback.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcryptjs |
| Real-time Communication | Socket.IO |
| AI Integration | Google Gemini API |
| Validation | Zod |
| Security | Helmet, Express Rate Limit |
| Online Meetings | Jitsi Meet |

## Project Structure

```text
SKILLMATE/
|
|-- client/
|   |-- css/
|   |-- js/
|   |-- pages/
|   |-- index.html
|
|-- server/
|   |-- controllers/
|   |-- models/
|   |-- routes/
|   |-- scripts/
|   |-- services/
|   |-- app.js
|   |-- server.js
|
|-- .env.example
|-- .gitignore
|-- package.json
|-- package-lock.json
|-- README.md
```

## Getting Started

### Prerequisites

Before running the project, install:

- Node.js
- npm
- MongoDB Atlas account or MongoDB instance
- Google Gemini API key for AI question generation

### 1. Clone the Repository

```bash
git clone https://github.com/gawaliraj64-collab/SKILLMATE.git
```

### 2. Navigate to the Project Folder

```bash
cd SKILLMATE
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root.

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure the following variables in `.env`:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5000

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash

AI_GENERATION_COOLDOWN_MS=60000
AI_MAX_GENERATION_PER_TOPIC=5
```

Replace the placeholder values with your own credentials.

**Important:** Never upload your actual `.env` file, API keys, database credentials or JWT secrets to GitHub.

### 5. Run the Application

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

Open the application in your browser:

http://localhost:5000

### Health Check

The backend health endpoint is:

http://localhost:5000/api/health

## Deployment

SkillMate can be deployed as a Node.js web service using Render.

General deployment configuration:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | npm install |
| Start Command | npm start |
| Branch | feature/skill-assessment |

Configure production environment variables in Render.

Make sure MongoDB Atlas allows connections from the deployed application.

## Security

- Password hashing using bcryptjs.
- JWT-based authentication.
- Protected API routes.
- Input validation using Zod.
- Security headers using Helmet.
- API rate limiting.
- Environment-based secret management.

## Future Scope

- Expand the assessment question bank.
- Support additional skills and learning topics.
- Improve student matching recommendations.
- Introduce additional learning analytics.
- Enhance the collaborative learning experience.

## Project Information

**Project Name:** SkillMate

**Category:** AI-Assisted Peer Learning Platform

**Platform:** College-first peer learning application

**Purpose:** To encourage collaborative learning by connecting students who want to teach, learn and exchange skills.

---

*SkillMate - Learn from each other. Grow together.*
