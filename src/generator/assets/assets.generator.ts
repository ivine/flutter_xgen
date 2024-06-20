const fs = require('fs')
const p = require('path')
import * as vscode from 'vscode'

import { Scalar, YAMLMap, YAMLSeq } from 'yaml'

import WorkspaceManager from '../../manager/workspace.manager'
import AssetFileByCr1992 from '../../model/assets'
import FXGProject from '../../model/project'
import { FlutterAssetsGeneratorConfigByCr1992, FlutterGenConfig } from '../../model/project.enum'
import { FileUtil } from '../../util/file.util'
import { FlutterAssetsConfigCr1992Constants, ProjectInfoMsgInterface } from '../../webview/const'
import { checkIfDartPackageInstalled, installDartPubGlobalPackage, runTerminalCommand } from '../../util/process.util'

class AssetsGenerator {
  private static instance: AssetsGenerator | null = null
  private constructor() {}
  static getInstance(): AssetsGenerator {
    if (!AssetsGenerator.instance) {
      AssetsGenerator.instance = new AssetsGenerator()
    }
    return AssetsGenerator.instance
  }

  // MARK: - Flutter Gen
  public async runFlutterGen(projectInfo: ProjectInfoMsgInterface, config: FlutterGenConfig) {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Flutter XGen: FlutterGen 运行中...',
        cancellable: true
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {
          console.log('User canceled the long running operation')
        })

        progress.report({ increment: 0 })

        try {
          await this._runFlutterGen(projectInfo, config)
          progress.report({ increment: 100 })
          await new Promise((resolve) => setTimeout(resolve, 500))
          vscode.window.showInformationMessage('Flutter XGen: FlutterGen 生成成功')
        } catch (error) {
          vscode.window.showErrorMessage('Flutter XGen: FlutterGen 生成失败')
        }
        // Simulate a long running task
        // for (let i = 0; i <= 100; i++) {
        //   if (token.isCancellationRequested) {
        //     break;
        //   }
        //   progress.report({ increment: 1, message: `Step ${i}/100` });
        //   await new Promise(resolve => setTimeout(resolve, 100));
        // }
      }
    )
  }

  private async _runFlutterGen(projectInfo: ProjectInfoMsgInterface, config: FlutterGenConfig) {
    // TODO: 检查 Flutter Gen 安装方式
    // 当前默认用户使用 dart pub global
    // TODO: /bin/sh: dart: command not found
    const packageName = 'flutter_gen'
    const isInstalled_pub_global = await checkIfDartPackageInstalled(packageName)
    if (!isInstalled_pub_global) {
      // 安装
      const suc = await installDartPubGlobalPackage(packageName)
      if (suc) {
        await runTerminalCommand(packageName)
      }
    }

    const commandString = `
      export PATH="$PATH:$HOME/.pub-cache/bin"
      export PATH="$PATH:/usr/local/opt/dart/libexec/bin"
      export PATH="$PATH:$HOME/fvm/default/bin"
      export PATH="$PATH:${WorkspaceManager.getInstance().dartPath}"
      cd ${projectInfo.dir}
      fluttergen
      ` // TODO: 优化一下

    const result = await runTerminalCommand(commandString)

    console.log('runFlutterGen, result: ', result.stdout)
  }

  // MARK: - FlutterAssetsGenerator - cr1992
  public async runCr1992Generator(projectInfo: ProjectInfoMsgInterface, config: FlutterAssetsGeneratorConfigByCr1992) {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Flutter XGen: Cr1992 运行中...',
        cancellable: true
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {
          console.log('User canceled the long running operation')
        })

        progress.report({ increment: 0 })

        try {
          await this._runCr1992Generator(projectInfo, config)
          progress.report({ increment: 100 })
          await new Promise((resolve) => setTimeout(resolve, 500))
          vscode.window.showInformationMessage(`Flutter XGen: Cr1992 assets 生成成功`)
        } catch (error) {
          if (error.message !== 'User canceled the operation') {
            vscode.window.showErrorMessage(`Flutter XGen: Cr1992 assets 生成失败`)
          }
        }
      }
    )
  }

  private async _runCr1992Generator(projectInfo: ProjectInfoMsgInterface, config: FlutterAssetsGeneratorConfigByCr1992) {
    // 用户自定义配置
    const path_ignore = config.path_ignore ?? FlutterAssetsConfigCr1992Constants.path_ignore
    const output_dir = config.output_dir ?? FlutterAssetsConfigCr1992Constants.output_dir
    const output_filename = config.output_filename ?? FlutterAssetsConfigCr1992Constants.output_filename

    // 读取配置
    const project: FXGProject | null = WorkspaceManager.getInstance().getProjectByDir(projectInfo.dir)
    if (project === null) {
      throw new Error('项目不存在')
    }

    const assetsPaths = (project.pubspecDoc.get('flutter') as YAMLMap)?.get('assets') as YAMLSeq
    let avaliableAssetsPaths: string[] = assetsPaths.items.map((e: Scalar) => e.value as string)
    if (!Array.isArray(avaliableAssetsPaths)) {
      throw Error('未配置 flutter: assets: 路径')
    } else if (avaliableAssetsPaths.length === 0) {
      throw Error('flutter: assets: 路径为空')
    }
    if (Array.isArray(path_ignore) && path_ignore.length > 0) {
      // 过滤路径
      avaliableAssetsPaths = avaliableAssetsPaths.filter((item1: string) => !avaliableAssetsPaths.some((item2) => item1.includes(item2)))
    }
    // 移除不存在的路径
    avaliableAssetsPaths = avaliableAssetsPaths.filter((e: string) => {
      let tmpDir = p.join(project.dir, e)
      return fs.existsSync(tmpDir)
    })

    // 根据配置获取所有文件
    const fileItemList: AssetFileByCr1992[] = []
    for (let path of avaliableAssetsPaths) {
      const fullDir = projectInfo.dir + '/' + path
      const allFiles = FileUtil.getDirAllFiles(fullDir, false)
      for (const file of allFiles) {
        const isDir = await FileUtil.pathIsDir(file)
        if (isDir) {
          continue
        }
        const item = new AssetFileByCr1992(projectInfo, config, file)
        fileItemList.push(item)
      }
    }

    // 排序
    fileItemList.sort((a: AssetFileByCr1992, b: AssetFileByCr1992) => {
      let pathA = a.generatedVarKey
      let pathB = b.generatedVarKey
      return pathA > pathB ? 1 : -1
    })

    // 生成 assets.dart 的内容
    const fileContent = this.generateAssetsDotDartFileContent(config, fileItemList)

    // 写入文件
    const file_relative_path = `lib/${output_dir}/${output_filename}.dart`
    const output_file_path = `${projectInfo.dir}/${file_relative_path}`
    if (fs.existsSync(output_file_path)) {
      fs.writeFileSync(output_file_path, '')
    } else {
      // 确保目录存在，如果不存在则递归创建
      fs.mkdirSync(p.dirname(output_file_path), { recursive: true })
    }
    fs.writeFileSync(output_file_path, fileContent)
  }

  private generateAssetsDotDartFileContent(config: FlutterAssetsGeneratorConfigByCr1992, assets: AssetFileByCr1992[]): string {
    // 开始构建Assets类的字符串
    let className = config.class_name ?? FlutterAssetsConfigCr1992Constants.class_name
    let tips = `///This file is automatically generated. DO NOT EDIT, all your changes would be lost.`
    let classContent = `${tips}\nclass ${className} {\n  ${className}._();\n\n`
    for (let asset of assets) {
      // 添加每个asset到类定义中
      classContent += `  ${asset.generatedLineString}\n`
    }
    classContent += '\n' // https://github.com/cr1992/FlutterAssetsGenerator 它生成的会多一个换行
    classContent += `}\n`
    return classContent
  }
}

export default AssetsGenerator
