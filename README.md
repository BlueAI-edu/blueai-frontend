# BlueAI Frontend

React-based frontend for the BlueAI Assessment Platform.

## Overview

BlueAI is an AI-powered educational assessment platform for teachers to create assessments and students to submit answers for AI marking.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Create React App with CRACO
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **State Management**: React hooks
- **Routing**: React Router v7
- **Charts**: Recharts
- **Authentication**: Azure MSAL for Microsoft OAuth

## Project Structure

```
.
├── package.json          # Dependencies and scripts
├── craco.config.js      # CRA customization config
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
├── components.json      # shadcn/ui configuration
├── eslint.config.js     # ESLint configuration
├── public/              # Static assets
└── src/
    ├── App.js           # Main application with routing
    ├── App.css          # Global styles
    ├── index.js         # Application entry point
    ├── index.css        # Tailwind imports
    ├── msalConfig.js    # Microsoft auth configuration
    ├── lib/
    │   └── utils.js     # Utility functions
    ├── hooks/           # Custom React hooks
    ├── pages/           # Page components
    │   ├── LandingPage.js
    │   ├── LoginPage.js
    │   ├── TeacherDashboardPage.js
    │   ├── QuestionsPage.js
    │   ├── EnhancedAssessmentBuilderPage.js
    │   ├── EnhancedAssessmentDetailPage.js
    │   ├── EnhancedAttemptPage.js
    │   ├── AttemptPage.js
    │   ├── JoinPage.js
    │   └── AuthCallbackPage.js
    └── components/
        ├── ProtectedRoute.js
        ├── TeacherPages.js
        ├── ClassesPage.js
        ├── AnalyticsPage.js
        ├── CSVImportPage.js
        ├── OCRUploadPage.js
        ├── OCRReviewPage.js
        ├── OCRModerationPage.js
        ├── QuestionBank.js
        ├── AIQuestionGenerator.js
        ├── MathKeyboard.js
        ├── StudentMathKeyboard.js
        ├── StudentCalculator.js
        ├── GraphPlotter.js
        ├── FormulaSheet.js
        ├── StepByStepInput.js
        ├── ShowWorkingScratchpad.js
        ├── LaTeXRenderer.js
        └── ui/              # shadcn/ui components
            ├── button.jsx
            ├── card.jsx
            ├── dialog.jsx
            └── ...
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Configure environment:
   ```bash
   cp example.env .env
   # Edit .env with your actual values
   ```

3. Start development server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Environment Variables

Required variables (see `example.env`):
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_AZURE_CLIENT_ID` - Azure AD client ID for authentication
- `REACT_APP_AZURE_TENANT_ID` - Azure AD tenant ID

## Available Scripts

- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Features

### Teacher Features
- Dashboard with assessment management
- Question bank with LaTeX support
- Assessment builder with multiple question types
- Class and student management
- CSV import for students
- Real-time analytics and heatmaps
- PDF report viewing

### Student Features
- Join assessments with unique codes
- Math input with keyboard and calculator
- Graph plotting for math questions
- Formula sheets
- Auto-save every 15 seconds
- Fullscreen mode with anti-cheat measures
- View feedback and download PDFs

### Technical Features
- Responsive design with Tailwind CSS
- Accessible UI components
- Real-time charts and analytics
- Drag-and-drop CSV import
- OCR upload and review workflow
- LaTeX rendering for math

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

Private - All rights reserved.
