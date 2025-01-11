import { vswhere } from "../src/vswhere";

const assert = require('assert');
describe('vswhere module', () => {
    it('should return installations with valid properties', async () => {
        const installations = await vswhere.getVSInstallations();
        assert(installations.length > 0);
        const installation = installations[0];
        assert(installation.instanceId);
        assert(installation.installDate);
        assert(installation.installationName);
        assert(installation.installationPath);
        assert(installation.installationVersion);
        assert(installation.productId);
        assert(installation.productPath);
        assert(installation.state !== undefined);
        assert(installation.isComplete !== undefined);
        assert(installation.isLaunchable !== undefined);
        assert(installation.isPrerelease !== undefined);
        assert(installation.isRebootRequired !== undefined);
        assert(installation.displayName);
        assert(installation.description);
        assert(installation.channelId);
        assert(installation.channelUri);
        assert(installation.enginePath);
        assert(installation.installedChannelId);
        assert(installation.installedChannelUri);
        assert(installation.releaseNotes);
        assert(installation.resolvedInstallationPath);
        assert(installation.thirdPartyNotices);
        assert(installation.updateDate);
        assert(installation.catalog);
        assert(installation.properties);
    });

    it('should handle options correctly', async () => {
        const options: vswhere.Options = {
            all: true,
            prerelease: true,
            products: [vswhere.Product.Community, vswhere.Product.Enterprise],
            versionRange: [{ major: 17 }, { major: 18, exclusive: true }],
            latest: true,
            sort: true,
            legacy: false
        };
        const installations = await vswhere.getVSInstallations(options);
        assert(installations.length === 1);
    });

    it('should throw an error if vswhere is not found', async () => {
        const originalEnv = process.env;
        process.env = { ...originalEnv, ProgramFiles: '', 'ProgramFiles(x86)': '' };
        try {
            await vswhere.getVSInstallations();
            assert.fail('Expected error was not thrown');
        } catch (err) {
            assert((<any>err).message.includes('vswhere could not be found'));
        } finally {
            process.env = originalEnv;
        }
    });
});