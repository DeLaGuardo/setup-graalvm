"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGraalVM = void 0;
const core = __importStar(require("@actions/core"));
const io = __importStar(require("@actions/io"));
const exec = __importStar(require("@actions/exec"));
const tc = __importStar(require("@actions/tool-cache"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let tempDirectory = process.env['RUNNER_TEMP'] || '';
const IS_WINDOWS = process.platform === 'win32';
if (!tempDirectory) {
    let baseLocation;
    if (IS_WINDOWS) {
        baseLocation = process.env['USERPROFILE'] || 'C:\\';
    }
    else {
        if (process.platform === 'darwin') {
            baseLocation = '/Users';
        }
        else {
            baseLocation = '/home';
        }
    }
    tempDirectory = path.join(baseLocation, 'actions', 'temp');
}
let platform = '';
if (IS_WINDOWS) {
    platform = 'windows';
}
else {
    if (process.platform === 'darwin') {
        platform = 'darwin';
    }
    else {
        platform = 'linux';
    }
}
function getGraalVM(graalvm, java, arch) {
    return __awaiter(this, void 0, void 0, function* () {
        const version = `${graalvm}.${java}.${arch}`;
        let toolPath = tc.find('GraalVM', getCacheVersionString(version), arch);
        let compressedFileExtension = '';
        const allGraalVMVersions = tc.findAllVersions('GraalVM');
        core.info(`Versions of graalvm available: ${allGraalVMVersions}`);
        if (toolPath) {
            core.debug(`GraalVM found in cache ${toolPath}`);
        }
        else {
            if (java) {
                compressedFileExtension = IS_WINDOWS ? '.zip' : '.tar.gz';
                const downloadPath = `https://github.com/graalvm/graalvm-ce-builds/releases/download/vm-${graalvm}/graalvm-ce-${java}-${platform}-${arch}-${graalvm}${compressedFileExtension}`;
                core.info(`Downloading GraalVM from ${downloadPath}`);
                const graalvmFile = yield tc.downloadTool(downloadPath);
                const tempDir = path.join(tempDirectory, `temp_${Math.floor(Math.random() * 2000000000)}`);
                const graalvmDir = yield unzipGraalVMDownload(graalvmFile, compressedFileExtension, tempDir);
                core.debug(`graalvm extracted to ${graalvmDir}`);
                toolPath = yield tc.cacheDir(graalvmDir, 'GraalVM', getCacheVersionString(version));
            }
            else {
                throw new Error('No java version.');
            }
        }
        const extendedJavaHome = `JAVA_HOME_${version}`;
        core.exportVariable('JAVA_HOME', toolPath);
        core.exportVariable(extendedJavaHome, toolPath);
        core.exportVariable('GRAALVM_HOME', toolPath);
        core.addPath(path.join(toolPath, 'bin'));
    });
}
exports.getGraalVM = getGraalVM;
function getCacheVersionString(version) {
    const versionArray = version.split('.');
    const major = versionArray[0];
    const minor = versionArray.length > 1 ? versionArray[1] : '0';
    const patch = versionArray.length > 2 ? versionArray.slice(2).join('-') : '0';
    return `${major}.${minor}.${patch}`;
}
function extractFiles(file, fileEnding, destinationFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        const stats = fs.statSync(file);
        if (!stats) {
            throw new Error(`Failed to extract ${file} - it doesn't exist`);
        }
        else if (stats.isDirectory()) {
            throw new Error(`Failed to extract ${file} - it is a directory`);
        }
        if ('.tar.gz' === fileEnding) {
            yield tc.extractTar(file, destinationFolder);
        }
        else if ('.zip' === fileEnding) {
            yield tc.extractZip(file, destinationFolder);
        }
    });
}
function unpackJars(fsPath, javaBinPath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (fs.existsSync(fsPath)) {
            if (fs.lstatSync(fsPath).isDirectory()) {
                for (const file of fs.readdirSync(fsPath)) {
                    const curPath = path.join(fsPath, file);
                    yield unpackJars(curPath, javaBinPath);
                }
            }
            else if (path.extname(fsPath).toLowerCase() === '.pack') {
                // Unpack the pack file synchonously
                const p = path.parse(fsPath);
                const toolName = IS_WINDOWS ? 'unpack200.exe' : 'unpack200';
                const args = IS_WINDOWS ? '-r -v -l ""' : '';
                const name = path.join(p.dir, p.name);
                yield exec.exec(`"${path.join(javaBinPath, toolName)}"`, [
                    `${args} "${name}.pack" "${name}.jar"`
                ]);
            }
        }
    });
}
function unzipGraalVMDownload(repoRoot, fileEnding, destinationFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        yield io.mkdirP(destinationFolder);
        const graalvmFile = path.normalize(repoRoot);
        const stats = fs.statSync(graalvmFile);
        if (stats.isFile()) {
            yield extractFiles(graalvmFile, fileEnding, destinationFolder);
            const graalvmFolder = fs.readdirSync(destinationFolder)[0];
            if (process.platform === 'darwin') {
                for (const f of fs.readdirSync(path.join(destinationFolder, graalvmFolder, 'Contents', 'Home'))) {
                    yield io.cp(path.join(destinationFolder, graalvmFolder, 'Contents', 'Home', f), path.join(destinationFolder, graalvmFolder, f), { recursive: true });
                }
                yield io.rmRF(path.join(destinationFolder, graalvmFolder, 'Contents'));
            }
            const graalvmDirectory = path.join(destinationFolder, graalvmFolder);
            yield unpackJars(graalvmDirectory, path.join(graalvmDirectory, 'bin'));
            return graalvmDirectory;
        }
        else {
            throw new Error(`Jdk argument ${graalvmFile} is not a file`);
        }
    });
}
