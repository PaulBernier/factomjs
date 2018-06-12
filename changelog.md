# Changelog

## [Unreleased]

### Changed

* Parse Admin Block entries

## [0.2.2] 2018-06-01

### Fixed

* Fix the `dist/factom.js` file. Now using webpack to build.

## [0.2] 2018-05-24

* More robust API calls: replaced factomdjs and factom-walletdjs by custom implementation with retry strategy. Possitibilty to customize retry strategy.
* Usage of `factomdApi` and `walletdApi` now mimics the raw API interfaces.
* Introduced the concept of 'BlockContext' for Entries and Transactions.
* Added methods for manipulating addresses and cryptographic keys. Lead to removal of dependency on factomjs-util
* Removal of dependencies lead to a much slimmer build!
* Fixed browserify build, now generates a minified version of the distribution file.
* Significantly increase code coverage (+ added code coverage tool).
* Various optimizations and bug fixes

