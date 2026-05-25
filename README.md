# VocabX

VocabX is an AI-powered vocabulary learning platform. It leverages advanced techniques such as spaced repetition, semantic analysis, and personalized quizzes to help users efficiently master new words for competitive exams and professional communication.

---

## Features

- **AI Tutor:** Uses NLP and semantic mapping to model your vocabulary progress, generate mnemonics, and provide context-rich examples.
- **Spaced Repetition Flashcards:** Scientifically schedules word reviews to optimize memory retention.
- **Quiz Arena:** Personalized quizzes for words you've learned, including dynamic question/option generation.
- **Progress Tracking:** Monitors mastery, repetitions, and review intervals.
- **Word Analysis:** Displays definition, synonyms, pronunciation, mnemonic, usage examples, and Bengali translation for each word.
- **Competitive Exam Support:** Provides curated lists/flashcards for BCS, Bank Recruitment, GRE, GMAT, and IELTS and professional language mastery.
- **User Authentication:** Access control and profile isolation per user.
- **Security:** Strong rules enforce user data isolation at the Firestore level.

## Installation

**Prerequisites:**  
- [Node.js](https://nodejs.org/)
- Gemini API Key (for Google’s Gemini AI integration)

Clone the repository, then install dependencies:

```bash
git clone https://github.com/farhankabir133/vocab-X.git
cd vocab-X
npm install
```

Create a `.env.local` file with the following content (see `.env.example` for details):

```env
GEMINI_API_KEY=your_api_key_here
APP_URL=your_deployment_url
```

## Usage

To run the app locally:

```bash
npm run dev
```

Visit the local development server (usually `http://localhost:5173`).

## Core Modules

- **`src/pages/QuizArena.tsx`** – Quiz generation and answer/score logic.
- **`src/pages/Flashcards.tsx`** – Spaced repetition flashcards and review management.
- **`src/pages/Dashboard.tsx`** – User dashboard, recent words, stats.
- **`src/pages/About.tsx`** – Platform overview, FAQ, and supported exam/product niches.

## Security

- Each user’s data is protected—users can only read/write their own profile and word lists.
- Key security rules/logic are specified in [`security_spec.md`](./security_spec.md).

## Configuration

- AI API keys and deployment URLs are specified in `.env.local`.
- App uses Firebase for data/storage/auth; configuration is set in `firebase-applet-config.json`.

## License

No license was found in the repository.

---

> _This README was generated automatically from the repository code and configuration files. For updates or contributions, submit a pull request on [GitHub](https://github.com/farhankabir133/vocab-X)._
