# ✨ readme-ai-generator

This project is a Next.js starter that leverages AI (specifically, Google's Gemini model via Genkit) to automatically generate comprehensive README files for GitHub repositories. It supports both public and private repositories (the latter requiring a Personal Access Token). Users can customize the length of the generated README and choose whether to include emojis, as well as translate the README into multiple languages.

## 🚀 Key Features

*   **AI-Powered README Generation:** Automatically generates README files based on repository analysis using Genkit and Google AI.
*   **Customizable Length:** Users can specify the desired length of the README (short, medium, or long).
*   **Emoji Support:** Option to include emojis in the README for enhanced readability.
*   **Multi-Language Translation:** Supports translation of the generated README into multiple languages.
*   **Private Repository Support:** Can generate READMEs for private repositories using a GitHub Personal Access Token.
*   **User Edits:** Allows the user to edit the AI-generated README content.

## 🛠️ Technologies Used

*   [TypeScript](https://www.typescriptlang.org/)
*   [Next.js](https://nextjs.org/)
*   [@genkit-ai/googleai](https://www.npmjs.com/package/@genkit-ai/googleai)
*   [@genkit-ai/next](https://www.npmjs.com/package/@genkit-ai/next)
*   [Genkit](https://genkit.dev/)
*   @radix-ui (various components)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [@tanstack/react-query](https://tanstack.com/query/latest)
*   [Firebase](https://firebase.google.com/)

## ⚙️ Prerequisites

Before you begin, ensure you have met the following requirements:

*   [Node.js](https://nodejs.org/) (version >=18)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   A Google Cloud project with the Gemini API enabled and the necessary credentials configured for Genkit.
*   (For private repositories) A GitHub Personal Access Token with 'repo' scope.

## 📦 Installation

1.  Clone the repository:

    ```sh
    git clone https://github.com/slammers001/readme-ai-generator.git
    cd readme-ai-generator
    ```

2.  Install dependencies:

    ```sh
    npm install
    # or
    yarn install
    ```

3.  Set up environment variables:

    *   Copy `.env.example` to `.env`.
    *   Fill in the necessary API keys and credentials in the `.env` file. This typically includes credentials for Genkit/Google AI and optionally a GitHub Personal Access Token for private repositories.

4.  Patch packages:
    ```sh
    npx patch-package
    ```

## 🚦 Getting Started

1.  Run the development server:

    ```sh
    npm run dev
    # or
    yarn dev
    ```

2.  Open your browser and navigate to `http://localhost:9002` (or the port specified in your `.env` file).

3.  Enter the URL of the GitHub repository you want to generate a README for.

4.  Customize the README length and other options as desired.

5.  Click the "Generate README" button.

## ✍️ Usage Examples

This project provides a user interface for generating README files. Here's how to use it:

1.  **Enter Repository URL:** Provide the URL of the GitHub repository. For example:

    ```
    https://github.com/slammers001/readme-ai-generator
    ```

2.  **Configure Options:** Select the desired README length (short, medium, or long) and whether to include emojis.

3.  **Generate README:** Click the "Generate README" button. The application will use AI to analyze the repository and generate a README file.

4.  **Review and Edit:** The generated README will be displayed in a preview window. You can edit the content directly in the preview window and use the "Improve" button to refine the README using AI based on your edits.

5.  **Download:** Once you are satisfied with the README, you can download it as a Markdown file.

## 🗂️ Project Structure

```text
readme-ai-generator/
├── .env.example                # Example environment variables
├── next.config.ts              # Next.js configuration
├── package.json                # Project dependencies and scripts
├── package-lock.json           # Dependency lock file
├── postcss.config.js           # PostCSS configuration
├── src/
│   ├── ai/                      # AI-related code
│   │   ├── flows/             # Genkit flows for generating and improving READMEs
│   │   │   ├── generate-readme.ts  # Flow to generate the README
│   │   │   ├── improve-readme.ts   # Flow to improve the README based on user edits
│   │   │   └── translate-readme.ts # Flow to translate the README to a different language
│   │   ├── genkit.ts            # Genkit AI configuration
│   │   └── tools/             # Custom Genkit tools
│   │       └── github-repo-tool.ts # Tool to fetch repo info from GitHub
│   ├── app/                     # Next.js application code
│   │   ├── globals.css         # Global CSS styles
│   │   ├── layout.tsx          # Root layout component
│   │   └── page.tsx            # Main page component
│   ├── components/              # React components
│   │   ├── custom/            # Custom components
│   │   │   ├── logo.tsx          # Logo component
│   │   │   ├── readme-preview.tsx # Readme Preview component
│   │   │   ├── repo-input-form.tsx # Input form for repo URL and options
│   │   │   └── theme-toggle-button.tsx # Theme Toggle button component
│   │   └── ui/                # UI components (Radix UI)
│   ├── hooks/                   # Custom React hooks
│   │   └── use-toast.ts        # Custom hook for displaying toasts
│   └── lib/                     # Utility functions
│       └── utils.ts            # Utility functions
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, concise messages.
4.  Submit a pull request.

## ✨ Contributors

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/slammers001" title="slammers001">
        <img src="https://github.com/slammers001.png?size=60" width="60px;" alt=""/>
      </a>
    </td>
  </tr>
</table>

## 📄 License

MIT


---
Generated by [ReadMeMagic](https://github.com/slammers001/readme-ai-generator)
