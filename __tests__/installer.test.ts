import io = require('@actions/io');
import os = require('os');
import fs = require('fs');
import path = require('path');
import child_process = require('child_process');

const toolDir = path.join(__dirname, 'runner', 'tools');
const tempDir = path.join(__dirname, 'runner', 'temp');
const graalvmDir = path.join(__dirname, 'runner', 'graalvm');

process.env['RUNNER_TOOL_CACHE'] = toolDir;
process.env['RUNNER_TEMP'] = tempDir;
import * as installer from '../src/installer';

let graalvmFilePath = '';
let graalvmUrl = '';
if (process.platform === 'win32') {
  graalvmFilePath = path.join(graalvmDir, 'graalvm-ce-windows-.zip');
  graalvmUrl =
    'https://github.com/oracle/graal/releases/download/vm-19.2.0.1/graalvm-ce-windows-amd64-19.2.0.1.zip';
} else if (process.platform === 'darwin') {
  graalvmFilePath = path.join(graalvmDir, 'graalvm_mac.tar.gz');
  graalvmUrl =
    'https://github.com/oracle/graal/releases/download/vm-19.2.0.1/graalvm-ce-darwin-amd64-19.2.0.1.tar.gz';
} else {
  graalvmFilePath = path.join(graalvmDir, 'graalvm_linux.tar.gz');
  graalvmUrl =
    'https://github.com/oracle/graal/releases/download/vm-19.2.0.1/graalvm-ce-linux-amd64-19.2.0.1.tar.gz';
}

describe('installer tests', () => {
  beforeAll(async () => {
    await io.rmRF(toolDir);
    await io.rmRF(tempDir);
    if (!fs.existsSync(`${graalvmFilePath}.complete`)) {
      await io.mkdirP(graalvmDir);

      console.log('Downloading graalvm');
      child_process.execSync(`curl -L "${graalvmFilePath}" --output "${graalvmUrl}"`);
      fs.writeFileSync(`${graalvmFilePath}.complete`, 'content');
    }
  }, 300000);

  afterAll(async () => {
    try {
      await io.rmRF(toolDir);
      await io.rmRF(tempDir);
    } catch {
      console.log('Failed to remove test directories');
    }
  }, 100000);

  it('Throws if invalid version', async () => {
    let thrown = false;
    try {
      await installer.getGraalVM('1000');
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
  });

  it('Downloads graalvm with normal semver syntax', async () => {
    await installer.getGraalVM('19.2.0');
    const GraalVMDir = path.join(toolDir, 'GraalVM', '19.2.0', os.arch());

    expect(fs.existsSync(`${GraalVMDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(GraalVMDir, 'bin'))).toBe(true);
  }, 100000);

  it('Downloads graalvm with broken semver syntax', async () => {
    await installer.getGraalVM('19.2.0.1');
    const GraalVMDir = path.join(toolDir, 'GraalVM', '19.2.0-1', os.arch());

    expect(fs.existsSync(`${GraalVMDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(GraalVMDir, 'bin'))).toBe(true);
  }, 100000);

  it('Uses version of GraalVM installed in cache', async () => {
    const GraalVMDir: string = path.join(
      toolDir,
      'GraalVM',
      '19.2.0.1',
      os.arch()
    );
    await io.mkdirP(GraalVMDir);
    fs.writeFileSync(`${GraalVMDir}.complete`, 'hello');
    await installer.getGraalVM('19.2.0.1');
    return;
  });

  it('Doesnt use version of GraalVM that was only partially installed in cache', async () => {
    const GraalVMDir: string = path.join(
      toolDir,
      'GraalVM',
      '19.2.0.1',
      os.arch()
    );
    await io.mkdirP(GraalVMDir);
    let thrown = false;
    try {
      await installer.getGraalVM('1000');
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
    return;
  });
});
