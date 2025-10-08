# 10xCards

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)

A web application that simplifies and accelerates the process of creating study materials by automatically generating flashcard sets from any user-provided text.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope (MVP)](#project-scope-mvp)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10xCards is designed for students and learners who spend significant time manually creating flashcards. The core feature of the application is its ability to take any pasted text and automatically generate front-and-back flashcard pairs, removing the tedious, time-consuming step of study preparation. This allows users to move from notes to active learning much faster.

The Minimum Viable Product (MVP) focuses on providing a simple, clean, and responsive interface for user account management, deck creation, AI-powered flashcard generation, and a straightforward study mode.

## Tech Stack

The project is built with a modern, scalable, and cost-effective tech stack designed for rapid development.

-   **Frontend:** [Astro](https://astro.build/) with [React](https://react.dev/) islands for a fast UI with rich interactivity.
-   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Authentication, Real-time APIs) for all backend logic, user management, and data persistence.
-   **AI Integration:** [OpenRouter.ai](https://openrouter.ai/) for seamless access to various AI models for flashcard generation.
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [Shadcn/ui](https://ui.shadcn.com/) components.
-   **DevOps:** [GitHub](https://github.com/) for version control and [GitHub Actions](https://github.com/features/actions) for CI/CD.

## Getting Started Locally

To set up and run the project on your local machine, follow these steps.

### Prerequisites

-   **Node.js:** The project uses a specific version of Node.js. It's recommended to use a version manager like [nvm](https://github.com/nvm-sh/nvm).
    ```sh
    # The required version is specified in the .nvmrc file
    node -v # Should output v22.14.0
    ```

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/aleksandrio/10xCards.git
    cd 10xCards
    ```

2.  **Set the Node.js version:**
    If you are using `nvm`, run the following command in the project root:
    ```sh
    nvm use
    ```

3.  **Install dependencies:**
    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```sh
    cp .env.example .env
    ```
    You will need to populate this file with your own keys for services like Supabase and OpenRouter.ai.

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application should now be running at `http://localhost:4321`.

## Available Scripts

The following scripts are available in the `package.json`:

-   `npm run dev`: Starts the development server with hot-reloading.
-   `npm run build`: Builds the application for production.
-   `npm run preview`: Starts a local server to preview the production build.
-   `npm run lint`: Lints the codebase for errors.
-   `npm run lint:fix`: Lints the codebase and automatically fixes issues.
-   `npm run format`: Formats the code using Prettier.

## Project Scope (MVP)

### In Scope

-   **User Authentication:** Secure user registration, login, logout, and password reset.
-   **Deck Management:** Users can create, view, rename, and delete decks of flashcards.
-   **AI Flashcard Generation:** Generate flashcards automatically by pasting in text (up to 5000 characters).
-   **Manual Flashcard Management:** Manually create, edit, and delete individual flashcards.
-   **Study Mode:** A simple interface to study a deck with randomized cards, showing the front and allowing the user to "flip" for the back.
-   **System Limits:** A maximum of 10 decks per user and 100 flashcards per deck.

### Out of Scope

-   Sub-decks, folders, or tagging.
-   Sharing, importing, or exporting decks.
-   Advanced flashcard formatting (e.g., images, rich text).
-   Advanced study modes (e.g., spaced repetition).
-   Public deck library or user profile settings.

## Project Status

**In Development**

This project is currently under active development, focusing on delivering the core features for the Minimum Viable Product (MVP).

## License

This project is not currently licensed. Please check back later for updates.
