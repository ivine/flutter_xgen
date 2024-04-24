import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn, WebviewPanelOnDidChangeViewStateEvent } from "vscode";
import { getUri, getNonce } from "../util/webview.util";
import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';

/**
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class FXGWebPanel {
  public static currentPanel: FXGWebPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  /**
   * The FXGWebPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(panel: WebviewPanel, extensionUri: Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.onDidChangeViewState(this.onDidChangeViewState)
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static render(extensionUri: Uri, arbFiles: string[]) {
    if (FXGWebPanel.currentPanel) {
      FXGWebPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      var workspaceFolderUri: Uri | null = null;
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceFolder = workspaceFolders[0];
        workspaceFolderUri = vscode.Uri.file(workspaceFolder.uri.fsPath);
      }
      var localResRoots = [Uri.joinPath(extensionUri, "dist"), Uri.joinPath(extensionUri, "webview_ui")];
      if (workspaceFolderUri) {
        localResRoots.push(workspaceFolderUri)
      }

      const panel = window.createWebviewPanel(
        "showL10nUI",
        "FXG UI",
        ViewColumn.One,
        {
          enableScripts: true,
          // localResourceRoots: [Uri.joinPath(extensionUri, "dist"), Uri.joinPath(extensionUri, "webview_ui")],
          retainContextWhenHidden: true,
          localResourceRoots: localResRoots,
        }
      );

      FXGWebPanel.currentPanel = new FXGWebPanel(panel, extensionUri);
    }

    let jsonMap = {};
    for (let tmpPath of arbFiles) {
      const fileContent = fs.readFileSync(tmpPath, 'utf-8');
      const fileName = path.basename(tmpPath);
      jsonMap[fileName] = fileContent;
    }
    if (jsonMap) {
      setTimeout(() => {
        FXGWebPanel.currentPanel._panel.webview.postMessage({ type: 'fileContent', content: jsonMap });
      }, 500);
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    FXGWebPanel.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, ["dist", "webview_ui", "assets", "index.css"]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, ["dist", "webview_ui", "assets", "index.js"]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src ${webview.cspSource}; style-src ${webview.cspSource}; 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>FXG UI</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case "hello":
            // Code that should run in response to the hello message command
            window.showInformationMessage(text);
            return;
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
        }
      },
      undefined,
      this._disposables
    );
  }

  private onDidChangeViewState(e: WebviewPanelOnDidChangeViewStateEvent) {
    if (e.webviewPanel.visible) {
      // 同步一下文件状态
      // l10n
      // assets
    }
  }
}
