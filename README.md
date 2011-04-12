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

<img src="https://github.com/nodejitsu/jitsu/raw/master/test/promptscreenshot.png"/>

After you've logged in, you can start deploying apps immediately!

<img src="https://github.com/nodejitsu/jitsu/raw/master/test/screenshot.png"/>


## Command Line Options

`jitsu` is mostly self-documenting. Try any of these commands to get started.

### Help

     jitsu help
     jitsu help apps
     jitsu help snapshots
     jitsu help users
     jitsu help config

## .jitsuconf file

All configuration data for your local `jitsu` install is located in the *.jitsuconf* file located in your home directory. Directly modifying this file is not really advised. You should be able to make all configuration changes via:

    jitsu config

## Libraries
<a name="Libraries"></a>
The Nodejitsu team and friends have been building and using these tools actively for the past two years. They are the most used Node libraries (see: [http://search.npmjs.org/](http://search.npmjs.org/)) and are actively maintained. Each tool serves a specific function, which we highly suggest you check each one out individually. 

[colors](http://github.com/marak/colors) - Terminal Colors module
[optimist](http://github.com/substack/optimist) - CLI Options Parsing
[request](http://github.com/mikeal/request) - http request module
[async](https://github.com/caolan/async) - Asynchronous Iteration
[vows](http://vowsjs.org) - Asynchronous BDD testing library
[winston](http://github.com/indexzero/winston/) - Multi-transport logging library

### Need more?
The documentation for `jitsu` and the Nodejitsu APIs is open-source and a work in-progress. For more information checkout the [Nodejitsu Handbook](http://github.com/nodejitsu/handbook)

#### (C) Copyright 2010, Nodejitsu Inc.