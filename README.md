# isLeakedServer

# Installing
```
npm install isLeakedServer -g
```

# Setup

Hosts a simple API for checking if passwords are available in a password list.

1) Make sure to download the password list torrent [torrent file of 64M passwords](https://crackstation.net/downloads/crackstation-human-only.txt.gz.torrent)
    * You can also provide your own list, just make sure its new line delimited for every word.

2) Extract the text file

3) Ensure postgresql is running and the environment variable PG_URL has been set.

4) From your terminal run ```isLeaked createTables```

5) Run ```isLeaked addPasswords <filepath of text password list>```

6) Run ```isLeaked addIndexes``` this takes around 10 minutes, depending on disk performance

Now you can start the server ```isLeaked run```

# API usage

See [API.md](https://github.com/bearjaws/isLeakedServer/blob/master/API.md)

# Client

For convenience, the isLeakedServer has a companion client

```
npm install isLeaked
```

Please see [isLeaked Client](https://www.npmjs.com/package/isLeaked)
