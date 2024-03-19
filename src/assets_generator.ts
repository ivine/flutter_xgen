import * as vscode from 'vscode';

const fs = require('fs');
const p = require('path');
const yaml = require('js-yaml');

import AssetFile from './asset_file';
import { FXGAssetsConstants, AssetsGeneratorConfig } from './config';

class AssetsGenerator {
  constructor() {}

  get workspaceDir(): string | null {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
      // 获取第一个工作区的路径
      const workspaceFolder = vscode.workspace.workspaceFolders[0];
      return workspaceFolder.uri.fsPath;
    } else {
      // 没有打开的工作区
      return null;
    }
  }

  config: AssetsGeneratorConfig | null = null;

  public async generate() {
    try {
      let yamlData = await this.parseYamlFile();
      let fxgAssetsConfigs = yamlData?.[FXGAssetsConstants.KEY_CONFIGURATION_MAP] as any;
      let packageName = yamlData?.[FXGAssetsConstants.KEY_PROJECT_NAME] as string;

      let outputDir = fxgAssetsConfigs?.[FXGAssetsConstants.KEY_OUTPUT_DIR] ?? FXGAssetsConstants.VALUE_OUTPUT_DIR;
      let className = fxgAssetsConfigs?.[FXGAssetsConstants.KEY_CLASS_NAME] ?? FXGAssetsConstants.VALUE_CLASS_NAME;
      let autoDetection = fxgAssetsConfigs?.[FXGAssetsConstants.KEY_AUTO_DETECTION] ?? false;
      let namedWithParent = fxgAssetsConfigs?.[FXGAssetsConstants.KEY_NAMED_WITH_PARENT] ?? true;
      let leadingWithPackageName = fxgAssetsConfigs?.[FXGAssetsConstants.KEY_LEADING_WITH_PACKAGE_NAME] ?? false;
      let outputFilename = fxgAssetsConfigs?.[FXGAssetsConstants.KEY_OUTPUT_FILENAME] ?? FXGAssetsConstants.VALUE_OUTPUT_FILENAME;
      let filenameSplitPattern = fxgAssetsConfigs?.[FXGAssetsConstants.KEY_FILENAME_SPLIT_PATTERN] ?? FXGAssetsConstants.VALUE_FILENAME_SPLIT_PATTERN;
      let pathIgnore = fxgAssetsConfigs?.[FXGAssetsConstants.KEY_PATH_IGNORE] ?? FXGAssetsConstants.VALUE_PATH_IGNORE;
      
      this.config = new AssetsGeneratorConfig(
        outputDir,
        className,
        packageName,
    
        autoDetection,
        namedWithParent,
        leadingWithPackageName,
        outputFilename,
        filenameSplitPattern,
        pathIgnore,
      );

      let assetsPaths = yamlData?.flutter?.assets;
      if (!Array.isArray(assetsPaths)) {
        throw(Error("未配置 flutter: assets: 路径"));
      } else if (assetsPaths.length === 0) {
        throw(Error("flutter: assets: 路径为空"));
      }
      if (Array.isArray(pathIgnore) && pathIgnore.length > 0) {
        // 过滤路径
        assetsPaths = assetsPaths.filter((item1: string)=> !pathIgnore.some(item2 => item1.includes(item2)));
      }

      // 移除不存在的路径
      assetsPaths = assetsPaths.filter((e: string) => {
        let tmpDir = p.join(this.workspaceDir, e);
        return fs.existsSync(tmpDir);
      });

      // generate file model
      const fileItemList: AssetFile[] = [];
      for (let path of assetsPaths) {
        let fullDir = this.workspaceDir + '/' + path;
        let allFiles = this.getDirAllFiles(fullDir);
        let assetDir = path;
        for (let file of allFiles) {
          const item = new AssetFile(this.workspaceDir ?? "", assetDir, file, this.config);
          fileItemList.push(item);
        }
      }
  
      // 排序
      fileItemList.sort((a: AssetFile, b: AssetFile) => {
        let pathA = a.dartVarName;
        let pathB = b.dartVarName;
        return pathA > pathB ? 1 : -1;
      });

      // 生成
      this.generateAssetsFile(fileItemList);

    } catch (err) {
      console.log(`err: ${err}`);
      throw(err);
    }
  }
  
  private async parseYamlFile(): Promise<any> {
    try {
      let filePath = p.join(this.workspaceDir, "pubspec.yaml");
      const fileContents = await this.readFileSync(filePath);
      const data = yaml.load(fileContents);
      return data;
    } catch (err) {
      console.log(`err: ${err}`);
      throw(Error("无法解析 pubspec.yaml 文件。"));
    }
  }

  private async readFileSync(path: string): Promise<string> {
    try {
      const absolutePath = await p.resolve(path);
      const data = fs.readFileSync(absolutePath, 'utf8');
      return data;
    } catch (err) {
      console.log(`err: ${err}`);
      throw(Error(`${path}, 文件读取失败。`));
    }
  }

  // 获取所有文件
  public getDirAllFiles(dir: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach((file: string) => {
      const fullPath = p.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        // 子文件夹不添加
        // arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      } else {
        // Exclude .DS_Store files
        if (!file.includes('.DS_Store')) {
          arrayOfFiles.push(fullPath);
        }
      }
    });
    return arrayOfFiles;
  }

  // 生成 assets.dart 文件
  private generateAssetsFile(generatedVarList: AssetFile[]): void {
    let workspaceDir = this.workspaceDir;
    if (workspaceDir?.length === 0) {
      return;
    }
    let relativePath = this.config?.outputDir ?? "generated";
    let fileName = (this.config?.outputFilename ?? "assets") + '.dart';
    const generatedAssetsFilePath = p.join(workspaceDir, 'lib', relativePath, fileName);
    try {
      // 检查文件是否存在，如果存在，则先清空文件
      if (fs.existsSync(generatedAssetsFilePath)) {
        fs.writeFileSync(generatedAssetsFilePath, '');
      } else {
        // 确保目录存在，如果不存在则递归创建
        fs.mkdirSync(p.dirname(generatedAssetsFilePath), { recursive: true });
      }
  
      // 生成assets类的内容并写入文件
      const assetsClassContent = this.generateAssetsDotDartFileContent(generatedVarList);
      fs.writeFileSync(generatedAssetsFilePath, assetsClassContent);
    } catch (err) {
      console.log(`err: ${err}`);
      throw(Error(`${fileName} 生成失败。`));
    }
  }

  // 生成 assets.dart 文件内容
  private generateAssetsDotDartFileContent(assets: AssetFile[]): string {
    // 开始构建Assets类的字符串
    let className = this.config?.className ?? "Assets";
    let tips = `///This file is automatically generated. DO NOT EDIT, all your changes would be lost.`;
    let classContent = `${tips}\nclass ${className} {\n  ${className}._();\n\n`;
  
    for (let asset of assets) {
      // 添加每个asset到类定义中
      classContent += `  ${asset.getDartAssetLine()}\n`;
    }
    classContent += '\n'; // https://github.com/cr1992/FlutterAssetsGenerator 它生成的会多一个换行
    classContent += `}\n`;
  
    return classContent;
  }
}

export default AssetsGenerator;