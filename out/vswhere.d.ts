export declare namespace vswhere {
    /**
     * Represents a Visual Studio installation.
     */
    interface Installation {
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
        };
        properties: {
            campaignId: string;
            channelManifestId: string;
            includeRecommended?: string;
            nickname: string;
            setupEngineFilePath: string;
        };
    }
    /**
     * Represents a Visual Studio version and whether it should be included in the version range.
     */
    interface Version {
        major: number;
        minor?: number;
        patch?: number;
        exclusive?: boolean;
    }
    /**
     * Represents a Visual Studio product ID.
     */
    enum Product {
        Community = "Microsoft.VisualStudio.Product.Community",
        Professional = "Microsoft.VisualStudio.Product.Professional",
        Enterprise = "Microsoft.VisualStudio.Product.Enterprise",
        BuildTools = "Microsoft.VisualStudio.Product.BuildTools"
    }
    /**
     * Options for querying Visual Studio installations.
     */
    interface Options {
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
    function getVSInstallations(options?: Options): Promise<Installation[]>;
}
