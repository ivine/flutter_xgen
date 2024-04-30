import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

import { getUri, getNonce } from "../util/webview.util"
import { WebViewType, WebViewTypeData, getWebViewTypeData } from "./const"
import { getExtensionContext } from '../extension'

export class FXGBinaryWebPanel {
  public static currentPanel: FXGBinaryWebPanel | undefined
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []

  private _binaryFilePath: string

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, binaryFilePath: string) {
    this._binaryFilePath = binaryFilePath

    this._panel = panel
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    this._panel.onDidChangeViewState(this.onDidChangeViewState)
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri)
    this._setWebviewMessageListener(this._panel.webview)
  }

  public static render(extensionUri: vscode.Uri, binaryFilePath: string) {
    // 获取配置的类型
    let webViewTypeData: WebViewTypeData = getWebViewTypeData(WebViewType.binaryPreview)
    let viewType: string = webViewTypeData.viewType
    let title: string = webViewTypeData.title
    let viewColumn: vscode.ViewColumn = webViewTypeData.viewColumn

    if (FXGBinaryWebPanel.currentPanel) {
      FXGBinaryWebPanel.currentPanel._panel.reveal(viewColumn)
    } else {
      var workspaceFolderUri: vscode.Uri | null = null
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (workspaceFolders && workspaceFolders.length > 0) {
        const workspaceFolder = workspaceFolders[0]
        workspaceFolderUri = vscode.Uri.file(workspaceFolder.uri.fsPath)
      }
      var localResRoots = [vscode.Uri.joinPath(extensionUri, "dist"), vscode.Uri.joinPath(extensionUri, "webview_ui")]
      if (workspaceFolderUri) {
        localResRoots.push(workspaceFolderUri)
      }

      const panel = vscode.window.createWebviewPanel(
        viewType,
        title,
        viewColumn,
        {
          enableScripts: true,
          retainContextWhenHidden: false,
          localResourceRoots: localResRoots,
        }
      )
      FXGBinaryWebPanel.currentPanel = new FXGBinaryWebPanel(panel, extensionUri, binaryFilePath)
    }
  }

  public dispose() {
    this._binaryFilePath = ""

    FXGBinaryWebPanel.currentPanel = undefined
    this._panel.dispose()
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const filePath = vscode.Uri.file(this._binaryFilePath)
    const imagePath = vscode.Uri.file(path.join(getExtensionContext().extensionPath, 'image.png'))
    const imageSrc = this._panel.webview.asWebviewUri(filePath)

    const nonce = getNonce()

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Image Preview</title>
      </head>
      <body>
          <img src="${imageSrc}" alt="Preview Image" style="max-width: 100%">
      </body>
      </html>
    `
  }

  // extension 状态监听
  private onDidChangeViewState(e: vscode.WebviewPanelOnDidChangeViewStateEvent) {
    // 同步一下文件状态
    if (e.webviewPanel.visible) {
    }
  }

  // web h5 -> vscode extension
  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command
        const text = message.text

        switch (command) {
          case "hello":
            vscode.window.showInformationMessage(text)
            return
        }
      },
      undefined,
      this._disposables
    )
  }
}
