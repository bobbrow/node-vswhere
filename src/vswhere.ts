'use strict';

import { spawn } from "child_process";
import { promises as fs } from "fs";

export namespace vswhere {
    /**
     * Represents a Visual Studio installation.
     */
    export interface Installation {
        instanceId: string;
        installDate: string;
        installationName: string;
        installationPath: string;
        installationVersion: string;
        productId: string;
        productPath: string;
        state: number;
        isComplete: boolean;
        isLaunchable: boolean;
        isPrerelease: boolean;
        isRebootRequired: boolean;
        displayName: string;
        description: string;
        channelId: string;
        channelUri: string;
        enginePath: string;
        installedChannelId: string;
        installedChannelUri: string;
        releaseNotes: string;
        resolvedInstallationPath: string;
        thirdPartyNotices: string;
        updateDate: string;
        catalog: {
            buildBranch: string;
            buildVersion: string;
            id: string;
            localBuild: string;
            manifestName: string;
            manifestType: string;
            productDisplayVersion: string;
            productLine: string;
            productLineVersion: string;
            productMilestone: string;
            productMilestoneIsPreRelease: string;
            productName: string;
            productPatchVersion: string;
            productPreReleaseMilestoneSuffix: string;
            productSemanticVersion: string;
            requiredEngineVersion: string;
        },
        properties: {
            campaignId: string;
            channelManifestId: string;
            includeRecommended?: string;
            nickname: string;
            setupEngineFilePath: string;
        }
    }

    /**
     * Represents a Visual Studio version and whether it should be included in the version range.
     */
    export interface Version {
        major: number;
        minor?: number;
        patch?: number;
        exclusive?: boolean;
    }

    /**
     * Represents a Visual Studio product ID.
     */
    export enum Product {
        Community = "Microsoft.VisualStudio.Product.Community",
        Professional = "Microsoft.VisualStudio.Product.Professional",
        Enterprise = "Microsoft.VisualStudio.Product.Enterprise",
        BuildTools = "Microsoft.VisualStudio.Product.BuildTools",
    }

    /**
     * Options for querying Visual Studio installations.
     */
    export interface Options {
        /**
         * Finds instances in complete, launchable, and incomplete states. By default, only instances
         * in a complete state - no errors or reboot required - are searched.
         */
        all?: boolean;

        /**
         * Finds instances in prerelease states. By default, only instances in release states are searched.
         */
        prerelease?: boolean;

        /**
         * One or more product IDs to find. Leave this unset to search all product instances installed.
         */
        products?: Product[];

        /**
         * One or more workload or component IDs required when finding instances. All specified IDs must
         * be installed unless -requiresAny is specified. You can specify wildcards including "?" to match
         * any one character, or "*" to match zero or more of any characters. See https://aka.ms/vs/workloads
         * for a list of workload and component IDs.
         */
        requires?: string[];

        /**
         * Find instances with any one or more workload or components IDs passed to `requires`.
         */
        requiresAny?: boolean;

        /**
         * A version range for instances to find.
         */
        versionRange?: [Version?, Version?];

        /**
         * Return only the newest version and last installed.
         */
        latest?: boolean;

        /**
         * Sorts the instances from newest version and last installed to oldest.
         */
        sort?: boolean;

        /**
         * Also searches Visual Studio 2015 and older products. Information is limited. This option cannot
         * be used with either `products` or `requires`.
         */
        legacy?: boolean;
    }

    /**
     * Gets information about the Visual Studio installations on the machine.
     * @param options Options for querying Visual Studio installations. If no options are set, `all`,
     * `prerelease`, and `sort` will default to `true`.
     * @returns A promise that resolves to an array of Visual Studio installation information objects.
     * @throws An error if `vswhere` could not be found or if `vswhere` reports an error.
     */
    export async function getVSInstallations(options?: Options): Promise<Installation[]> {
        if (process.platform !== 'win32') {
            throw new Error('vswhere is only available on Windows');
        }
        const args = getVSWhereArgs(options);
        const vswhere = await findVSWhere();
        const proc = spawn("cmd.exe", ['/c', `chcp 65001>nul && "${vswhere}" ${args.join(' ')}`], {shell: true});
        const installations: any = await new Promise((resolve, reject) => {
            const result: string[] = [];
            const error: string[] = [];
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
                } catch (err) {
                    reject(new Error(<any>err));
                }
            });
            proc.addListener('error', (err) => {
                reject(err);
            });
        });

        if (validateInstallations(installations)) {
            return installations;
        } else {
            throw new Error('Invalid installation data returned from vswhere');
        }
    }

    function getVSWhereArgs(options?: Options): string[] {
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
        } else {
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
            const lb = r[0]?.exclusive ? '(' : '[';
            const lv = versionToString(r[0]);
            const rv = versionToString(r[1]);
            const rb = r[1]?.exclusive ? ')' : ']';
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
        args.push('-format', 'json');;
        args.push('-utf8');

        return args;
    }

    function versionToString(version?: Version) {
        if (!version) {
            return '';
        }
        return version.major.toString() + (version.minor ? version.patch ? `.${version.minor}.${version.patch}` : `${version.minor}` : '');
    }

    async function findVSWhere(): Promise<string> {
        const programFiles32 = process.env['ProgramFiles(x86)'] || undefined;
        const programFiles = process.env['ProgramFiles'] || undefined;
        if (programFiles32) {
            const vswhere = `${programFiles32}\\Microsoft Visual Studio\\Installer\\vswhere.exe`;
            if (await fs.stat(vswhere).catch(() => false)) {
                return vswhere;
            }
        }
        if (programFiles) {
            const vswhere = `${programFiles}\\Microsoft Visual Studio\\Installer\\vswhere.exe`;
            if (await fs.stat(vswhere).catch(() => false)) {
                return vswhere;
            }
        }
        throw new Error('vswhere could not be found');
    }

    function validateInstallations(installations: any): installations is Installation[] {
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
}