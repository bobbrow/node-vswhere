'use strict';
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
exports.vswhere = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
var vswhere;
(function (vswhere_1) {
    /**
     * Represents a Visual Studio product ID.
     */
    let Product;
    (function (Product) {
        Product["Community"] = "Microsoft.VisualStudio.Product.Community";
        Product["Professional"] = "Microsoft.VisualStudio.Product.Professional";
        Product["Enterprise"] = "Microsoft.VisualStudio.Product.Enterprise";
        Product["BuildTools"] = "Microsoft.VisualStudio.Product.BuildTools";
    })(Product = vswhere_1.Product || (vswhere_1.Product = {}));
    /**
     * Gets information about the Visual Studio installations on the machine.
     * @param options Options for querying Visual Studio installations.
     * @returns A promise that resolves to an array of Visual Studio installation information objects.
     * @throws An error if `vswhere` could not be found or if `vswhere` reports an error.
     */
    function getVSInstallations(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (process.platform !== 'win32') {
                throw new Error('vswhere is only available on Windows');
            }
            const args = getVSWhereArgs(options);
            const vswhere = yield findVSWhere();
            const proc = (0, child_process_1.spawn)(vswhere, args, {});
            const installations = yield new Promise((resolve, reject) => {
                const result = [];
                const error = [];
                proc.stdout.on('data', (data) => {
                    result.push(data.toString());
                });
                proc.stderr.on('data', (data) => {
                    error.push(data.toString());
                });
                proc.addListener('close', () => {
                    if (error.length > 0) {
                        reject(new Error(error.join('')));
                    }
                    const json = result.join('');
                    if (json.length > 0 && json.at(0) != '[') {
                        reject(new Error(json));
                    }
                    try {
                        const ret = JSON.parse(json);
                        resolve(ret);
                    }
                    catch (err) {
                        reject(new Error(err));
                    }
                });
                proc.addListener('error', (err) => {
                    reject(err);
                });
            });
            if (validateInstallations(installations)) {
                return installations;
            }
            else {
                throw new Error('Invalid installation data returned from vswhere');
            }
        });
    }
    vswhere_1.getVSInstallations = getVSInstallations;
    function getVSWhereArgs(options) {
        var _a, _b;
        const args = [];
        if (!options) {
            options = { all: true, prerelease: true, sort: true };
        }
        if (options.all) {
            args.push('-all');
        }
        if (options.prerelease) {
            args.push('-prerelease');
        }
        if (options.products) {
            args.push('-products', ...options.products);
        }
        else {
            args.push('-products', '*');
        }
        if (options.requires) {
            args.push('-requires', ...options.requires);
        }
        if (options.requiresAny) {
            args.push('-requiresAny');
        }
        if (options.versionRange) {
            const r = options.versionRange;
            const lb = ((_a = r[0]) === null || _a === void 0 ? void 0 : _a.exclusive) ? '(' : '[';
            const lv = versionToString(r[0]);
            const rv = versionToString(r[1]);
            const rb = ((_b = r[1]) === null || _b === void 0 ? void 0 : _b.exclusive) ? ')' : ']';
            args.push('-version', `${lb}${lv},${rv}${rb}`);
        }
        if (options.latest) {
            args.push('-latest');
        }
        if (options.sort) {
            args.push('-sort');
        }
        if (options.legacy) {
            args.push('-legacy');
        }
        args.push('-format', 'json');
        ;
        args.push('-utf8');
        return args;
    }
    function versionToString(version) {
        if (!version) {
            return '';
        }
        return version.major.toString() + (version.minor ? version.patch ? `.${version.minor}.${version.patch}` : `${version.minor}` : '');
    }
    function findVSWhere() {
        return __awaiter(this, void 0, void 0, function* () {
            const programFiles32 = process.env['ProgramFiles(x86)'] || undefined;
            const programFiles = process.env['ProgramFiles'] || undefined;
            if (programFiles32) {
                const vswhere = `${programFiles32}\\Microsoft Visual Studio\\Installer\\vswhere.exe`;
                if (yield fs_1.promises.stat(vswhere).catch(() => false)) {
                    return vswhere;
                }
            }
            if (programFiles) {
                const vswhere = `${programFiles}\\Microsoft Visual Studio\\Installer\\vswhere.exe`;
                if (yield fs_1.promises.stat(vswhere).catch(() => false)) {
                    return vswhere;
                }
            }
            throw new Error('vswhere could not be found');
        });
    }
    function validateInstallations(installations) {
        if (!installations || !Array.isArray(installations)) {
            return false;
        }
        for (const installation of installations) {
            if (!installation.instanceId || !installation.installationPath || !installation.productId) {
                return false;
            }
        }
        return true;
    }
})(vswhere || (exports.vswhere = vswhere = {}));
