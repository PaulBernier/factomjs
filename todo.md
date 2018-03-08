# Critical path
* NoAck versions of add, and send transaction (update dock) capacility to chose wait on commit/reveal both
* logging


* newecaddress/newfctaddress => add to wallet or not ("generate-ec-address" "generate-factoid-address")
* getTransaction => transaction + info on inserted blocks

WRITE TEST

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
