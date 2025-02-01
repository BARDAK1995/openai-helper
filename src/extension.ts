import * as vscode from 'vscode';
import fetch from 'node-fetch'; // Ensure to install this package: npm install node-fetch

// Helper function to call the OpenAI API
async function askOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not set in environment variable OPENAI_API_KEY.');
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo", // or another available model
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }
  
  const data = await response.json();
  // Adjust this parsing based on the API response structure
  const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return reply || 'No response from OpenAI.';
}

export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('openai-helper.askQuestion', async () => {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor found.');
        return;
      }

      // Get full document text
      const fullText = editor.document.getText();
      
      // Get selected text (if any)
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      // Ask the user for their question
      const userQuestion = await vscode.window.showInputBox({ prompt: 'Enter your question about the code' });
      if (!userQuestion) {
        return;
      }
      
      // Construct the prompt for OpenAI:
      // You can customize how you want to combine the full code and/or selection with the user's question.
      let prompt = `I have the following code:\n\n${fullText}\n\n`;
      if (selectedText) {
        prompt += `I have selected this snippet:\n\n${selectedText}\n\n`;
      }
      prompt += `My question: ${userQuestion}`;
      
      // Optionally show a progress indicator
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Querying OpenAI...",
        cancellable: false
      }, async (progress) => {
        const answer = await askOpenAI(prompt);
        // Show the answer in an information message, output channel, or new document
        vscode.window.showInformationMessage(answer);
      });
      
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
