// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as FXGCommand from './command_names';
import AssetsGenerator from './assets_generator';

// TODO: auto_detection
let assetsWatcher: vscode.FileSystemWatcher;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	for (let commandName of Object.values(FXGCommand.FXGCommandNames)) {
		let disposable = vscode.commands.registerCommand(commandName, () => {
			if (commandName === FXGCommand.FXGCommandNames.AssetsGenerate) {
				assetsGenerate();
			} else if (commandName === FXGCommand.FXGCommandNames.AssetsStartWatch) {
				assetsWatch(context);
			} else if (commandName === FXGCommand.FXGCommandNames.AssetsStopWatch) {
				assetsStopWatch();
			}
		});
	
		context.subscriptions.push(disposable);
	}
}

async function assetsGenerate() {
  try {
    await new AssetsGenerator()?.generate();
    vscode.window.showInformationMessage(`Flutter XGen: Assets.dart 生成成功`);
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage(`${error}`);
  }
}

async function assetsWatch(context: vscode.ExtensionContext) {
	assetsStopWatch();
	assetsWatcher = vscode.workspace.createFileSystemWatcher('**/assets/**/*');

	const changeDisposable = assetsWatcher.onDidChange((uri) => {
		assetsGenerate();
	});

	const createDisposable = assetsWatcher.onDidCreate((uri) => {
		assetsGenerate();
	});

	const deleteDisposable = assetsWatcher.onDidDelete((uri) => {
		assetsGenerate();
	});

	context.subscriptions.push(assetsWatcher);

	vscode.window.setStatusBarMessage('Flutter XGen: Assets 文件夹监听已开启', 3000);
}

async function assetsStopWatch() {
	if (!assetsWatcher) {
		return;
	}
	assetsWatcher.dispose();
	vscode.window.setStatusBarMessage('Flutter XGen: Assets 文件夹监听已关闭', 3000);
}


// This method is called when your extension is deactivated
export function deactivate() {}
