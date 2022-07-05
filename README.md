# Bogbook

### A replicated and secure social network made from ed25519 hash chains

![example](./example.png)

This is my third attempt at making a distributed social network, the big difference between Bogbook v3 and Bogbook v2 is that I stopped using append-only logs, and now we are using a hash chain with no sequence order. 

The benefits of this are:

+ No need to sync the entire chain to begin interacting
+ You can use keypairs on multiple devices without completely breaking replication

The downsides are: 

+ less security guarantees than an append-only log

### Get started

Get yourself a copy of the [Deno](https://deno.land/) JavaScript runtime.

```
deno run --allow-all server.js
```

and navigate to http://localhost:8080

Generate a keypair, and then post a message!

...

or try it online! http://bogbook.com/

Visit my profile page [here](http://bogbook.com/#e+2bu3W0KeR00URX75mVtFsFrTgTfAW2R3+F9W+s324=) and say hello!

### How it works

When you publish a new post it references the sha256 hash of the previous post. If this is your first post then the hash of the post and the previous hash will be identical, and that is called a "root" post. The replication algorithm will stop trying to sync posts when it reaches the root.

Posts are created in the browser client, and then replicated onto "pub" servers. You can request the latest post from an author by sending the author's ed25519 public key to the server, the server will find the latest post from the author and then send it to you. 

Once you get the latest post from the author the replication algorithm asks for the hash of the previous post until you reach a post that you already have, then it will stop asking for previous posts and your copy of the feed is up to date. 

You sync from the latest post backwards, and thus you do not have to wait until an entire feed syncs before interacting on the network.

You can fork a feed by using two devices. To merge the feed, you will want to mention your fork in the text of a new message so that people can find the head of that branch and sync backwards until the fork is resolved. The algorithm itself does not fix forked feeds, but it won't break if there is a fork. 

### The Protocol

Messages are sent around using this protocol format:

```
<ed25519 Public Key><Signature>
```

which opens to a string that contains

```
<timestamp><ed25519 Public Key><Previous Post Hash><Data Hash><Post Hash>
```

And from that we create a message object:

```
{
  timestamp: <timestamp>,
  author: <ed25519 Public Key>,
  previous: <sha256 hash from previous post>,
  data: <sha256 hash of post data>,
  hash: <sha256 hash of post (ts, author, data)>,
  raw: <timestamp><ed25519 Public Key><Previous Post Hash><Data Hash><Post Hash>
}
```

This means we are not signing a JSON.stringified object, which should make it easier to port this to other programming languages.

---
MIT


