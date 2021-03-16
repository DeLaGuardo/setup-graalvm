import * as core from '@actions/core'
import * as io from '@actions/io'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'
import * as fs from 'fs'
import * as path from 'path'

let tempDirectory = process.env['RUNNER_TEMP'] || ''

const IS_WINDOWS = process.platform === 'win32'

if (!tempDirectory) {
  let baseLocation
  if (IS_WINDOWS) {
    baseLocation = process.env['USERPROFILE'] || 'C:\\'
  } else {
    if (process.platform === 'darwin') {
      baseLocation = '/Users'
    } else {
      baseLocation = '/home'
    }
  }
  tempDirectory = path.join(baseLocation, 'actions', 'temp')
}

let platform = ''

if (IS_WINDOWS) {
  platform = 'windows'
} else {
  if (process.platform === 'darwin') {
    platform = 'darwin'
  } else {
    platform = 'linux'
  }
}

export async function getGraalVM(
  graalvm: string,
  java: string,
  arch: string
): Promise<void> {
  const version = `${graalvm}.${java}.${arch}`
  let toolPath = tc.find('GraalVM', getCacheVersionString(version), arch)
  let compressedFileExtension = ''

  const allGraalVMVersions = tc.findAllVersions('GraalVM')
  core.info(`Versions of graalvm available: ${allGraalVMVersions}`)

  if (toolPath) {
    core.debug(`GraalVM found in cache ${toolPath}`)
  } else {
    if (java) {
      compressedFileExtension = IS_WINDOWS ? '.zip' : '.tar.gz'
      const downloadPath = `https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-${graalvm}/graalvm-ce-${java}-${platform}-${arch}-${graalvm}${compressedFileExtension}`

      core.info(`Downloading GraalVM from ${downloadPath}`)

      const graalvmFile = await tc.downloadTool(downloadPath)
      const tempDir: string = path.join(
        tempDirectory,
        `temp_${Math.floor(Math.random() * 2000000000)}`
      )
      const graalvmDir = await unzipGraalVMDownload(
        graalvmFile,
        compressedFileExtension,
        tempDir
      )
      core.debug(`graalvm extracted to ${graalvmDir}`)
      toolPath = await tc.cacheDir(
        graalvmDir,
        'GraalVM',
        getCacheVersionString(version)
      )
    } else {
      throw new Error('No java version.')
    }
  }

  const extendedJavaHome = `JAVA_HOME_${version}`
  core.exportVariable('JAVA_HOME', toolPath)
  core.exportVariable(extendedJavaHome, toolPath)
  core.exportVariable('GRAALVM_HOME', toolPath)
  core.addPath(path.join(toolPath, 'bin'))
}

function getCacheVersionString(version: string): string {
  const versionArray = version.split('.')
  const major = versionArray[0]
  const minor = versionArray.length > 1 ? versionArray[1] : '0'
  const patch = versionArray.length > 2 ? versionArray.slice(2).join('-') : '0'
  return `${major}.${minor}.${patch}`
}

async function extractFiles(
  file: string,
  fileEnding: string,
  destinationFolder: string
): Promise<void> {
  const stats = fs.statSync(file)
  if (!stats) {
    throw new Error(`Failed to extract ${file} - it doesn't exist`)
  } else if (stats.isDirectory()) {
    throw new Error(`Failed to extract ${file} - it is a directory`)
  }

  if ('.tar.gz' === fileEnding) {
    await tc.extractTar(file, destinationFolder)
  } else if ('.zip' === fileEnding) {
    await tc.extractZip(file, destinationFolder)
  }
}

async function unpackJars(fsPath: string, javaBinPath: string): Promise<void> {
  if (fs.existsSync(fsPath)) {
    if (fs.lstatSync(fsPath).isDirectory()) {
      for (const file of fs.readdirSync(fsPath)) {
        const curPath = path.join(fsPath, file)
        await unpackJars(curPath, javaBinPath)
      }
    } else if (path.extname(fsPath).toLowerCase() === '.pack') {
      // Unpack the pack file synchonously
      const p = path.parse(fsPath)
      const toolName = IS_WINDOWS ? 'unpack200.exe' : 'unpack200'
      const args = IS_WINDOWS ? '-r -v -l ""' : ''
      const name = path.join(p.dir, p.name)
      await exec.exec(`"${path.join(javaBinPath, toolName)}"`, [
        `${args} "${name}.pack" "${name}.jar"`
      ])
    }
  }
}

async function unzipGraalVMDownload(
  repoRoot: string,
  fileEnding: string,
  destinationFolder: string
): Promise<string> {
  await io.mkdirP(destinationFolder)

  const graalvmFile = path.normalize(repoRoot)
  const stats = fs.statSync(graalvmFile)
  if (stats.isFile()) {
    await extractFiles(graalvmFile, fileEnding, destinationFolder)
    const graalvmFolder = fs.readdirSync(destinationFolder)[0]
    if (process.platform === 'darwin') {
      for (const f of fs.readdirSync(
        path.join(destinationFolder, graalvmFolder, 'Contents', 'Home')
      )) {
        await io.cp(
          path.join(destinationFolder, graalvmFolder, 'Contents', 'Home', f),
          path.join(destinationFolder, graalvmFolder, f),
          {recursive: true}
        )
      }
      await io.rmRF(path.join(destinationFolder, graalvmFolder, 'Contents'))
    }
    const graalvmDirectory = path.join(destinationFolder, graalvmFolder)
    await unpackJars(graalvmDirectory, path.join(graalvmDirectory, 'bin'))
    return graalvmDirectory
  } else {
    throw new Error(`Jdk argument ${graalvmFile} is not a file`)
  }
}
