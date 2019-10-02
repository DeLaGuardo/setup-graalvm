# setup-graalvm

This action sets up GraalVM environment for using in GitHub Actions.

* It downloads (if it is not cached yet) required version of GraalVM Community edition
* Adds executors provided by GraalVM distribution to the environment
* Register problem matchers for error output

# Usage

```yaml
steps:
- uses: actions/checkout@latest
- uses: DeLaGuardo/setup-graalvm@latest
  with:
    graalvm-version: '19.2.0.1' // GraalVM version, no pattern syntax available atm.
- run: java -version
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
