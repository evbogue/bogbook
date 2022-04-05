# Borgbook

### Secure Scuttle Boat and The Innerplanetary File System

It occurred to me that I'm doing everything wrong and a log should only include a signed hash that is a link to a markdown file that itself contains links to other markdown files. These append-only logs are called "Secure Scuttle Boat" (ssb) These files are named as their sha2 hash and stored using the Innerplanetary File System (inpfs).

A client consuming ssb will either download the entire log in one go, or download however much of the log they do not already have. Then upon rendering the ssbs in the client _then_ we reach out to inpfs to request the blobs when we need them. 

This way initial sync of feeds is so fast you might even be able to do it on Mars, but who wants to go to Mars anyway. What people want is a fast and secure social network and ssb + inpfs = bogbook is the answer.

If you happen to crashland on mars and you decide to burn your spacecraft then maybe you can transmit your log of signed hashes back to Earth and someday your inpfs will sync when the Earthlings stop having a bandwidth problem.

### The Secure Scuttle Boat (ssb) protocol

Is an array of signed hashes and ts and includes the previous message hash

```
<hash><authorpubkey><previoushash><signatureofhash+ts>
```

Timestamps allow us to sort the log in chronological order.

### Innerplanetary File System

Is a file saved as a hash of itself. In the DB or FS we will save this file as a URLencoded hash so that we avoid using slashes as slashes break the filesystem on the server.

```
<hash>.md
<hash>.mp3
<hash>.jpg
<hash>.png
etc
```

This means you can look at the blobs with your file viewer on your computer because they are not in some obscure data storage format!

