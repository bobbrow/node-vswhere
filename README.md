# node-vswhere

Get information about Visual Studio installations.

## Usage

### definition
```ts
namespace vswhere {

    function getVSInstallations(options?: Options): Promise<Installation[]>;

}
```

### example
```ts
import { vswhere } from 'node-vswhere';

const installations = await vswhere.getVSInstallations()
    .catch(err => []);
```

### additional options

The following options map directly to the switches that `vswhere` supports. 

```ts
namespace vswhere {
    interface Options {
        all?: boolean;
        prerelease?: boolean;
        products?: string[];
        requires?: string[];
        requiresAny?: boolean;
        versionRange?: [Version?, Version?];
        latest?: boolean;
        sort?: boolean;
        legacy?: boolean;
    }
}
```

