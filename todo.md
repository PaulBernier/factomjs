# Critical path
* NoAck versions of add entry and add chain capacility to chose wait on commit/reveal both
* logging
* WRITE TEST
* throw Error instead of Strings!!

* newecaddress/newfctaddress => add to wallet or not ("generate-ec-address" "generate-factoid-address")

* RPC auth, SSL etc


# Secondary API
* getBlock (detect the type smartly) EntryBlock/AdminBlock/FactoidBlock/EntryCreditBlock structure
* list transactions from a FactoidBlock? Necessary?

# Non critical
## Inspired by Factom-cli

* get head
* abheight, dbheight, ecbheight, fbheight => heights
* pendingentries, pendingtransactions
* receipt: what's a receipt?
* exportaddresses/listaddresses (what's the diff?)
* get raw? Useful?

## Other
* Paginated retrieval
