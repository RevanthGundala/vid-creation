# Video Creation Platform

A modern, full-stack application for AI-powered video and 3D asset generation. Built with React, FastAPI, and Google Cloud Platform.

## 🚀 Features

- **AI Video Generation**: Create videos using advanced AI models
- **3D Asset Generation**: Generate 3D assets with Gaussian Splatting technology
- **Real-time Job Processing**: Monitor job progress with Server-Sent Events (SSE)
- **Authentication**: Secure authentication using WorkOS AuthKit
- **Cloud Storage**: Google Cloud Storage integration for asset management
- **Modern UI**: Built with React, TanStack Router, and Tailwind CSS
- **3D Visualization**: Three.js integration for 3D asset preview

## 🏗️ Architecture

### Frontend
- **Framework**: React 19 with TypeScript
- **Router**: TanStack Router with file-based routing
- **State Management**: TanStack Query for server state
- **Styling**: Tailwind CSS with Radix UI components
- **3D Graphics**: Three.js with React Three Fiber
- **Build Tool**: Vite

### Backend
- **Framework**: FastAPI (Python)
- **Database**: Google Cloud Firestore
- **Storage**: Google Cloud Storage
- **Authentication**: WorkOS AuthKit
- **AI Processing**: Replicate API integration
- **Infrastructure**: Pulumi for GCP deployment

## 📁 Project Structure

```
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts (auth, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── routes/          # TanStack Router routes
│   │   ├── lib/             # Utility functions
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── backend/                 # FastAPI application
│   ├── src/
│   │   ├── api/            # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── models/         # Data models
│   │   ├── repositories/   # Data access layer
│   │   └── schemas/        # Pydantic schemas
│   ├── infra/              # Infrastructure as Code (Pulumi)
│   └── pyproject.toml      # Backend dependencies
└── README.md               # This file
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **TanStack Router** - File-based routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Accessible UI components
- **Three.js** - 3D graphics
- **React Three Fiber** - React renderer for Three.js
- **Vite** - Build tool and dev server

### Backend
- **FastAPI** - Web framework
- **Python 3.11+** - Programming language
- **Pydantic** - Data validation
- **Google Cloud Firestore** - NoSQL database
- **Google Cloud Storage** - File storage
- **WorkOS** - Authentication
- **Replicate** - AI model hosting
- **Pulumi** - Infrastructure as Code

### DevOps
- **Docker** - Containerization
- **Google Cloud Platform** - Cloud infrastructure
- **Pulumi** - Infrastructure management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/bun
- Python 3.11+
- Google Cloud Platform account
- WorkOS account
- Replicate account

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vid-creation
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install  # or bun install
   ```

3. **Backend Setup**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -e .
   ```

4. **Environment Variables**

   Create `.env` files in both frontend and backend directories:

   **Frontend (.env)**
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_PUBLIC_POSTHOG_KEY=your_posthog_key
   VITE_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

   **Backend (.env)**
   ```env
   WORKOS_API_KEY=your_workos_api_key
   WORKOS_CLIENT_ID=your_workos_client_id
   WORKOS_REDIRECT_URI=http://localhost:8000/api/auth/callback
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
   GCP_STORAGE_BUCKET=your-storage-bucket
   REPLICATE_API_TOKEN=your_replicate_token
   ```

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   uvicorn src.main:app --reload --port 8000
   ```

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev  # or bun dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🔧 Development

### Frontend Development

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Preview production build
npm run serve
```

### Backend Development

```bash
cd backend

# Development server
uvicorn src.main:app --reload

# Run tests
pytest

# Generate API types
python -m scripts.generate_types
```

### Infrastructure

```bash
cd backend/infra

# Deploy to development
pulumi stack select dev
pulumi up

# Deploy to staging
pulumi stack select stage
pulumi up
```

## 📚 API Documentation

The API is documented using OpenAPI/Swagger. When running the backend, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

- **Authentication**
  - `GET /api/auth/login` - Initiate login
  - `GET /api/auth/callback` - Handle auth callback
  - `GET /api/auth/me` - Get current user
  - `POST /api/auth/logout` - Logout

- **Jobs**
  - `GET /api/jobs` - List user jobs
  - `POST /api/jobs` - Create new job
  - `GET /api/jobs/{job_id}` - Get job details
  - `GET /api/jobs/{job_id}/asset-url` - Get asset download URL

- **Webhooks**
  - `GET /api/webhooks/{job_id}/stream` - SSE stream for job updates
  - `POST /api/webhooks/test` - Test webhook endpoint

## 🔐 Authentication

The application uses WorkOS AuthKit for authentication:

1. Users click "Sign In" to be redirected to WorkOS AuthKit
2. After successful authentication, users are redirected back with an authorization code
3. The backend exchanges the code for user information
4. User session is maintained using secure cookies

## 🎥 Video Generation

The platform supports AI-powered video generation:

1. Users upload video files or provide prompts
2. Jobs are created and queued for processing
3. AI models process the videos using Replicate
4. Results are stored in Google Cloud Storage
5. Users can download generated videos via signed URLs

## 🎨 3D Asset Generation

3D assets are generated using Gaussian Splatting technology:

1. Users provide text prompts for 3D asset generation
2. AI models generate 3D representations
3. Assets are stored in K-Splat format
4. Three.js renders the 3D assets in the browser

## 🏗️ Deployment

### Google Cloud Platform

The application is designed to be deployed on Google Cloud Platform using Pulumi:

1. **Firestore** - User data and job metadata
2. **Cloud Storage** - Video and 3D asset files
3. **Cloud Run** - Backend API service
4. **Cloud Build** - CI/CD pipeline

### Docker

The backend includes a Dockerfile for containerized deployment:

```bash
cd backend/infra
docker build -t video-creation-backend .
docker run -p 8080:8080 video-creation-backend
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
```

### Backend Tests
```bash
cd backend
pytest
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the code comments and inline documentation

## 🔮 Roadmap

- [ ] Enhanced 3D asset editing capabilities
- [ ] Real-time collaboration features
- [ ] Advanced video processing options
- [ ] Mobile application
- [ ] Integration with additional AI models
- [ ] Performance optimizations
- [ ] Enhanced security features 