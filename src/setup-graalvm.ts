import * as core from '@actions/core'
import * as installer from './installer'
import * as path from 'path'

async function run(): Promise<void> {
  try {
    const deprecatedVersion = core.getInput('graalvm-version')

    const graalvm = core.getInput('graalvm')
    const java = core.getInput('java')
    const arch = core.getInput('arch')

    if (deprecatedVersion) {
      const versionParts = deprecatedVersion.match(/(.*)\.(java\d{1,2})$/)
      if (versionParts) {
        await installer.getGraalVM(versionParts[1], versionParts[2], arch)
      }
    } else {
      await installer.getGraalVM(graalvm, java, arch)
    }

    const matchersPath = path.join(__dirname, '..', '.github')
    core.info(`##[add-matcher]${path.join(matchersPath, 'graalvm.json')}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
