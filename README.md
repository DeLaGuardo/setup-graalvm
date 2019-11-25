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
- uses: DeLaGuardo/setup-graalvm@2.0
  with:
    graalvm-version: '19.3.0.java8' // GraalVM version, no pattern syntax available atm.
- run: java -version
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
