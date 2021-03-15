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
const core = __importStar(require("@actions/core"));
const installer = __importStar(require("./installer"));
const path = __importStar(require("path"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const deprecatedVersion = core.getInput('graalvm-version');
            const graalvm = core.getInput('graalvm');
            const java = core.getInput('java');
            const arch = core.getInput('arch');
            if (deprecatedVersion) {
                const versionParts = deprecatedVersion.match(/(.*)\.(java\d{1,2})$/);
                if (versionParts) {
                    yield installer.getGraalVM(versionParts[1], versionParts[2], arch);
                }
            }
            else {
                yield installer.getGraalVM(graalvm, java, arch);
            }
            const matchersPath = path.join(__dirname, '..', '.github');
            core.info(`##[add-matcher]${path.join(matchersPath, 'graalvm.json')}`);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
