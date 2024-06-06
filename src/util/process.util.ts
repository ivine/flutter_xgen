import { exec } from 'child_process'
import WorkspaceManager from '../manager/workspace.manager'

interface CommandResult {
  stdout: string
  stderr: string
}

/**
 * Runs a terminal command and returns a promise that resolves with the command output.
 * @param command The terminal command to run.
 * @returns A promise that resolves with the command's stdout and stderr.
 */
export function runTerminalCommand(command: string): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error.message}`)
        console.error(`stderr: ${stderr}`)
        reject({ stdout, stderr })
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

export async function installDartPubGlobalPackage(packageName: string): Promise<boolean> {
  try {
    const { stdout } = await runTerminalCommand(`${WorkspaceManager.getInstance().dartPath} pub global activate ${packageName}`)
    return stdout.includes(packageName)
  } catch (error) {
    console.error('Failed to check Dart packages', error)
    return false
  }
}

export async function checkIfDartPackageInstalled(packageName: string): Promise<boolean> {
  try {
    const { stdout } = await runTerminalCommand(`${WorkspaceManager.getInstance().dartPath} pub global list`)
    return stdout.includes(packageName)
  } catch (error) {
    console.error('Failed to check Dart packages', error)
    return false
  }
}
