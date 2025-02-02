# OpenAI Helper

OpenAI Helper is a VS Code extension that leverages OpenAI's reasoning models to help you understand your code and generate high-level flowcharts. With a simple right-click in the editor, you can ask questions about your code or generate a flowchart that outlines the code's structure, functions, and data flow.

## Features

- **Ask About Code:** Right-click anywhere in the code to ask OpenAI questions about it.
- **Generate Flowchart:** Right-click to generate a high-level flowchart that explains the code's structure and interactions between functions.
- **Configurable Reasoning:** Uses OpenAI's reasoning models with a balanced "medium" reasoning effort for complex tasks.
- **Easy Setup:** Simply set your `OPENAI_API_KEY` and start using the extension!

## Installation

1. Install the extension from the VSIX file or the Visual Studio Marketplace.
2. Set your environment variable `OPENAI_API_KEY` before launching VS Code, or update your debug configuration accordingly.

## Usage

- **Ask About Code:** Right-click in the editor and select **"Ask OpenAI about this code"**.
- **Generate Flowchart:** Right-click in the editor and select **"Generate Code Flowchart"**.

For further details, please see the [documentation](#) or contact the extension author.

---

Adjust this template as needed for your extension.

---

### 2. Package Again

Once you've updated and saved the README.md file:

1. Run the packaging command again:

   ```bash
   vsce package
