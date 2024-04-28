// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as path from 'path';
const fs = require('fs');

import CommandManager, * as FXGCommand from './manager/command.manager';
import AssetsGenerator from './assets_generator';
import { AssetsSideBar } from './side_bar/assets';
import { L10nSideBar } from './side_bar/l10n';

import { FXGWebPanel } from './webview/panel';
import FileManager from './manager/file.manager';
import WatcherManager from './manager/watcher.manager';

let globalContext: vscode.ExtensionContext;
function initializeExtension(context: vscode.ExtensionContext) {
	globalContext = context;
}
export function getExtensionContext(): vscode.ExtensionContext | null {
	return globalContext;
}

function workspaceDir(): string | null {
	if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
		// 获取第一个工作区的路径
		const workspaceFolder = vscode.workspace.workspaceFolders[0]
		return workspaceFolder.uri.fsPath
	} else {
		// 没有打开的工作区
		return null
	}
}

export function activate(context: vscode.ExtensionContext) {
	initializeExtension(context)

	// manager 初始化
	CommandManager.getInstance().setup();
	FileManager.getInstance().setup(workspaceDir())
	WatcherManager.getInstance().setup(workspaceDir())
}

export function deactivate() {
	WatcherManager.getInstance().dispose()
}










// TODO: auto_detection
let assetsWatcher: vscode.FileSystemWatcher | null = null;

const assetsSideBar = new AssetsSideBar('FXG-Assets', workspaceDir() ?? "");
vscode.window.registerTreeDataProvider(
	assetsSideBar.id,
	assetsSideBar
);

const l10nSideBar = new L10nSideBar('FXG-L10n', workspaceDir() ?? "");
vscode.window.registerTreeDataProvider(
	l10nSideBar.id,
	l10nSideBar
);


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