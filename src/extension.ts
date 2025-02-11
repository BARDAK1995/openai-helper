import * as vscode from 'vscode';
import fetch from 'node-fetch';

// A helper function to roughly limit the prompt (by character count)
function limitPrompt(prompt: string, maxChars: number): string {
  if (prompt.length > maxChars) {
    return prompt.slice(0, maxChars) + "\n\n...[truncated]";
  }
  return prompt;
}

// Generic function to call the OpenAI API with specified prompt and parameters
async function callOpenAI(prompt: string, reasoningEffort: "low" | "medium" | "high", maxCompletionTokens: number): Promise<string> {
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
      model: "o3-mini",                      // Use the o3-mini model
      reasoning_effort: reasoningEffort,       // Set reasoning effort (here "medium" for balanced response)
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: maxCompletionTokens
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }
  
  const data = await response.json();
  const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return reply || 'No response from OpenAI.';
}

// Function for asking about the code
async function askAboutCode(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor found.');
    return;
  }

  // Get full document text and selected text (if any)
  const fullText = editor.document.getText();
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);

  // Ask the user for their question about the code
  const userQuestion = await vscode.window.showInputBox({ prompt: 'Enter your question about the code' });
  if (!userQuestion) {
    return;
  }
  
  // Construct the prompt with the instruction first, followed by the code data
  let prompt = `My question: ${userQuestion}\n\n`;
  prompt += `I have the following code:\n\n${fullText}\n\n`;
  if (selectedText) {
    prompt += `I have selected this snippet:\n\n${selectedText}\n\n`;
  }
  
  // Limit the prompt (adjusted limit)
  prompt = limitPrompt(prompt, 100000);

  // Show progress and call the API
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "Querying OpenAI...",
    cancellable: false
  }, async () => {
    const answer = await callOpenAI(prompt, "medium", 5000);
    
    // Create a new untitled text document with the answer
    const document = await vscode.workspace.openTextDocument({
      content: answer,
      language: 'plaintext'
    });
    
    // Show the document in a new editor column (to the right) and enable word wrap
    await vscode.window.showTextDocument(document, {
      viewColumn: vscode.ViewColumn.Beside,
      preview: false
    });
    
    // Enable word wrapping for this document
    await vscode.workspace.getConfiguration('editor', document.uri)
      .update('wordWrap', 'on', vscode.ConfigurationTarget.Global);
  });
}

// Function for generating a high-level flowchart of the code
async function generateFlowchart(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor found.');
    return;
  }
  
  // Get full document text (the context for the flowchart)
  const fullText = editor.document.getText();
  
  // Construct the prompt with the instruction first, then the code
  let prompt = `Please provide a high-level flowchart that outlines the code structure. For each function, describe what it does, how it is called, the order of function calls, and how data flows between them. Provide a clear, concise overview without excessive details.\n\n`;
  prompt += `I have the following code:\n\n${fullText}\n\n`;
  
  // Limit the prompt (adjusted limit)
  prompt = limitPrompt(prompt, 250000);
  
  // Show progress and call the API
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "Generating flowchart...",
    cancellable: false
  }, async () => {
    const answer = await callOpenAI(prompt, "high", 10000);
    
    // Open a new text document to display the flowchart
    const document = await vscode.workspace.openTextDocument({
      content: answer,
      language: 'plaintext'
    });
    
    // Show the document in a new editor column (to the right) and enable word wrap
    await vscode.window.showTextDocument(document, {
      viewColumn: vscode.ViewColumn.Beside,
      preview: false
    });
    
    await vscode.workspace.getConfiguration('editor', document.uri)
      .update('wordWrap', 'on', vscode.ConfigurationTarget.Global);
  });
}

// New function for analyzing code improvements
async function analyzeCodeImprovements(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor found.');
    return;
  }
  
  // Get full document text (the context for the analysis)
  const fullText = editor.document.getText();
  
  // Construct the prompt with the instruction first, then the code
  let prompt = `Please analyze the following code and identify any inefficient implementations, mistakes, or areas where improvements can be made. The improvements should make the code more readable, compact, elegant, and efficient, without introducing bugs. List what can be done, how to do it, and why it would work, in a concise manner. and list them in a order of increasing diffuculty starting with the easiest safest one. \n\n`;
  prompt += `I have the following code:\n\n${fullText}\n\n`;
  
  // Limit the prompt (adjust as necessary)
  prompt = limitPrompt(prompt, 250000);
  
  // Show progress and call the API
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "Analyzing code for improvements...",
    cancellable: false
  }, async () => {
    const answer = await callOpenAI(prompt, "medium", 5000);
    
    // Create a new untitled text document with the answer
    const document = await vscode.workspace.openTextDocument({
      content: answer,
      language: 'plaintext'
    });
    
    // Show the document in a new editor column (to the right) and enable word wrap
    await vscode.window.showTextDocument(document, {
      viewColumn: vscode.ViewColumn.Beside,
      preview: false
    });
    
    await vscode.workspace.getConfiguration('editor', document.uri)
      .update('wordWrap', 'on', vscode.ConfigurationTarget.Global);
  });
}

export function activate(context: vscode.ExtensionContext) {
  console.log('OpenAI Helper extension is now active!');

  // Register command for asking about the code
  const askQuestionDisposable = vscode.commands.registerCommand('openai-helper.askQuestion', async () => {
    try {
      await askAboutCode();
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
  });

  // Register command for generating the flowchart
  const flowchartDisposable = vscode.commands.registerCommand('openai-helper.getFlowchart', async () => {
    try {
      await generateFlowchart();
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
  });
  
  // Register command for analyzing code improvements
  const analyzeCodeDisposable = vscode.commands.registerCommand('openai-helper.analyzeCode', async () => {
    try {
      await analyzeCodeImprovements();
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
  });

  context.subscriptions.push(askQuestionDisposable, flowchartDisposable, analyzeCodeDisposable);
}

export function deactivate() {}