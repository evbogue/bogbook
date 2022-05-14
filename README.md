# Bogbook v3 (a merkle tree grows in the bogusphere)

Ok, so append only logs are annoying because they take forever to sync. And keeping data on the log is the problem, so let's consider another way to do these things.

We need to have a block of signed hashes ordered by timestamp that is available on a server in the form of an timestamp sorted array.

```
<ts><pubkey><hash><previous><sig>
```

the sig is equal to 

```
<ts><pubkey><hash><previous>
```

And we only open it to confirm the block hasn't been modified

Next we fetch the hash to retrieve the data. If we can't find the hash, then we keep trying servers until we find it or we simply give up.

When we fetch the data we make sure that the hash is valid.

Bonus, we are staying away from JSON objects so no one runs into trouble implementing the signature structure if anyone ports this to another language someday.

Perhaps this is a merkle tree and we can consider the leaf nodes the data associated with the hashes? Someone can think about it and let me know if it is, or if this is somehow a different abstraction.

---
MIT


