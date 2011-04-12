# jitsu
*Flawless command line deployment of your Node.js apps to the cloud*

## Overview

[Jitsu](http://github.com/nodejitsu/jitsu) is a [Command Line Tool (CLI)](http://en.wikipedia.org/wiki/Command-line_interface) for deploying Node.js applications to the cloud. It's open-source and easy to use. We've designed Jitsu to be suitable for command line beginners, but still be powerful and extensible enough for production usage. If you aren't a fan of the command line or don't have terminal access you can still do everything Jitsu can do through our web admin, [Samurai](http://nodejitsu.com). 

Jitsu requires the npm, the node package manager.


## Installation

   [sudo] npm install jitsu

## Features

Jitsu is build with some amazing technologies we've been actively building with the community since 2009. jitsu is fully extendable and extremely modular ( see [Libaries](#Libraries) section).

 - Allows for seamless deployment of your Node.js applications to the cloud
 - Fully supports NPM dependency resolution on deployment to Nodejitsu
 - Full support of Nodejitu's API ( a plethora node.js goodies )
 - Integrated multi-level multi-transport logging support via [Winston](http://github.com/indexzero/winston/)
 - Too many to list... seek [further knowledge ](http://github.com/nodejitsu/handbook) or just try it out!
 
## Usage

Jistsu is mostly self documenting. After installation, run the `jitsu` command from your command line. 

If it's your first time using `jitsu`, you will be prompted to login with an existing account or create a new account.

<img src="https://github.com/nodejitsu/jitsu/raw/master/test/screenshot.png"/>

After you've logged in, you can start deploying apps immediately!

<img src="https://github.com/nodejitsu/jitsu/raw/master/test/screenshot.png"/>


## Command Line Options

### Help

     jitsu help
     jitsu help apps
     jitsu help snapshots
     jitsu help users
     jitsu help config


## Libraries

    "async": ">= 0.1.8",
    "colors": ">= 0.5.0",
    "optimist": ">= 0.1.7",
    "request": ">= 1.9.0",
    "vows": ">= 0.5.8",
    "winston": ">= 0.2.6"

### Need more?
The documentation for `jitsu` and the Nodejitsu APIs is open-source and a work in-progress. For more information checkout the [Nodejitsu Handbook](http://github.com/nodejitsu/handbook)

#### (C) Copyright 2010, Nodejitsu Inc.