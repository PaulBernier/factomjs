# Changelog

## Unreleased

### Changed

* `chunkSize` option for the `add*` methods has been deprecated and replaced by `concurrency`.

## [1.0.2]

### Removed

* Revert the unnecessary chanage in 1.0.1 for `rewindChainWhile` (the entry already contains a blockContext).

## [1.0.1]

### Added

* BlockContext populated for transactions in a `FactoidBlock` object (except `directoryBlockKeyMR` that is not available).
* `rewindChainWhile(chainId, predicate, fn)`: the `predicate` and `fn` functions now receive the entry block header as a second argument.

## [1.0.0]

### Added

* JSDoc of all public classes and methods.
* New util functions `generateRandomFctAddress` and `generateRandomEcAddress`.
* Method `toObject()` added to `Entry` and `Chain` classes. Returns a JavaScript object than can be serialized.
* TypeScript definition file (RewardChain contribution).

### Fixed

* Catch repeated commit exceptions properly.
* Rejection of negative transaction fees. 
* Handling of CORS with credentials. 
* Handle case `Error.captureStackTrace` is undefined (Firefox).
* Fix bug preventing to instanciate `FactomdCli` without params.

### Changed

* More explicit ack errors.
* `getTransaction` throws an `Error` if no transaction is found instead of returning `undefined`. To be consistent with `getEntry` behavior.
* Redirect factomd `current-minute` API call to v2 path (intead of debug path).
* Increased performance of `getEntryWithBlockContext`: fixed cost of 3 factomd API calls instead of rewinding the entry blocks of the chain.
* `keyToPrivateFctAddress` renamed `seedToPrivateFctAddress`.
* `keyToPrivateEcAddress` renamed `seedToPrivateEcAddress`.
* `add` throws an Error when trying to create a chain that already exists.
* All the `add*` functions validate by default that the paying EC address holds enough funds to pay for the commits. Can be bypassed by setting the option `skipFundValidation` to `true`.
* Added a check before sending a transaction that all EC ouputs have a factoshi amount above the minimum amount required to get at least 1 EC. It can be bypassed using the `force` option of `sendTransaction` method.
* Renamed `isValidFctPublicAddress`, `isValidFctPrivateAddress`, `isValidEcPrivateAddress` and `isValidEcPublicAddress` to respectively `isValidPublicFctAddress`, `isValidPrivateFctAddress`, `isValidPrivateEcAddress` and `isValidPublicEcAddress`.

### Removed

* Remove `FactomCli` methods `getNodeProperties` and `getWalletProperties`. Unnecessary wrappers.
* Do not expose internal constants anymore.

## [0.3.6] 2018-10-03

### Fixed

* Use Babel plugin `@babel/transform-modules-commonjs` to fix integration in the browser (broke after upgrade to Babel 7).

## [0.3.5] 2018-09-26

### Fixed

* Parsing of the descriptor index in an Admin block coinbase cancel entry.

## [0.3.4] 2018-09-13

### Added

* New FacomCli method `rewindChainWhile` that allows to iterate on a chain entry by entry.
* Expose `composeChainLedger` and `composeEntryLedger` functions.
* Allow manual signature of entry and chain commits (hardware wallet integration): `composeChainCommit` and `composeEntryCommit` can now take an EC public address as the 2nd argument and the commit signature as the 3rd argument.

## [0.3.3] 2018-09-10

### Added

* Options to override default API paths (`/v2` and `/debug`).

## [0.3.2] 2018-09-05

### Changed

* Renamed `addressToRcd` to `addressToRcdHash`. (breaking change)
* Fixed README.

## [0.3.1] 2018-08-29

### Changed

* Upgrade to Babel 7 for the bundling process.

## [0.3] 2018-08-27

### Added

* Create a second webpack bundle `factom-struct` containing only factom.js data structures, excluding all online calls related components (FactomCli...). Util for client side applications (browser).
* Check that transaction amounts are JS safe integers.
* `Chain` constructor now accepts another Chain to create a deep copy of it.
* FactomCli exposes `getPrivateAddress(address)`

### Changed

* `Entry.Builder(entry)` now makes a deep copy of entry.
* `entryBlockContext` method of the Entry builder renamed `blockContext`.
* Replaced dependency on `bn.js` by `long`.
* Replaced dependency on `elliptic` by `tweetnacl`. Tweetnacl is lighter and formally audited.

### Fixed

* Fixed blunt error when calling `getFirstEntry` and `getEntryWithBlockContext` for a chain that is not yet included in a Directory Block.

## [0.2.6] 2018-07-26

### Added

* New universal `add(obj, ecAddress)` function that can take as a first argument an Entry, a Chain, or an iterable containing any of those classes (can be mixed). Meant to replace the use of `addEntry`, `addChain`, `addEntries` and `addChains` (kept for backward compatibility).
* New `commit` and `reveal` functions that can take as a first argument an Entry or a Chain. Meant to replace the use of `commitEntry`/`commitChain` and `revealEntry`/`revealChain` respectively.

### Changed

* When used with list of Entries or Chains `add` chunks the list to bound the number of concurrent promises started (default to 200). Can be controlled with an attribute `chunkSize` of the `options` argument of this method.

## [0.2.5] 2018-07-15

### Changed

* `addressToKey` doesn't accept public Factoid addresses anymore. Created explicit `addressToRcd` function to handle public Factoid addresses. (breaking change)

## [0.2.4] 2018-07-12

### Added

* Add support for RPC user/password basic authentication
* Add option 'rejectUnauthorized' to allow connection to https nodes with self-signed certificates

### Fixed

* Fix M1 EntryCredit blocks parsing https://github.com/PaulBernier/factomjs/issues/1

## [0.2.3] 2018-06-26

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

