# setup-graalvm

This action sets up GraalVM environment for using in GitHub Actions.

* It downloads (if it is not cached yet) required version of GraalVM Community edition
* Adds executors provided by GraalVM distribution to the environment
* Register problem matchers for error output

# Notes:

Since version 19.3.0 each version of graalvm available with modifier to specify version of JDK. java8 and java11 are available atm.

# Usage

```yaml
steps:
- uses: actions/checkout@latest
- uses: DeLaGuardo/setup-graalvm@master
  with:
    graalvm-version: '19.3.0.java8' // GraalVM version, no pattern syntax available atm.
- run: java -version
```

# Using GraalVM Component Updater (aka. gu)

`gu` binary is available as `gu` on ubuntu and macos, on windows - as `gu.cmd`.

``` yaml
jobs:
  sample-job:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        gu-binary: [gu, gu.cmd]
        exclude:
          - os: ubuntu-latest
            gu-binary: gu.cmd
          - os: macos-latest
            gu-binary: gu.cmd
          - os: windows-latest
            gu-binary: gu
    steps:
      - name: Setup Graalvm
        id: setup-graalvm
        uses: DeLaGuardo/setup-graalvm@master
        with:
          graalvm-version: '21.0.0.java11'

      - name: Install native-image component
        run: |
          ${{ matrix.gu-binary }} install native-image
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
