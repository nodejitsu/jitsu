# jitsu
*Flawless command line deployment of Node.js apps to the cloud*

## Overview

[Jitsu](http://github.com/nodejitsu/jitsu) is a [Command Line Tool (CLI)](http://en.wikipedia.org/wiki/Command-line_interface) for deploying Node.js applications to the cloud. It's open-source and easy to use. We've designed Jitsu to be suitable for command line beginners, but still be powerful and extensible enough for production usage. If you aren't a fan of the command line or don't have terminal access you can still do everything Jitsu can do through our web admin, [Samurai](http://nodejitsu.com). 

Jitsu requires `npm`, the [node package manager](http://npmjs.org).


## Installation

    [sudo] npm install jitsu

## Features

Jitsu is built on some amazing technologies which we've been actively building with the community since 2009. jitsu is fully extend-able and extremely modular ( see [Libaries](#Libraries) section ).

 - Allows for seamless deployment of your Node.js applications to the cloud
 - Fully supports NPM dependency resolution on deployment to [Nodejitsu](http://nodejitsu.com)
 - Full support of Nodejitu's API ( a plethora node.js goodies )
 - Integrated multi-level multi-transport logging support via [Winston](http://github.com/indexzero/winston/)
 - Too many to list... seek [further knowledge ](http://github.com/nodejitsu/handbook) or just try it out!

# Deploying a path to the cloud

     cd /path/to/myapp
     jitsu deploy

This will create a new application, package.json, and deploy your path to [Nodejitsu](http://nodejitsu.com). If it's your first deployment, you'll be prompted for some information such as *subdomain* and *start script* but it's really easy and we promise it will only take a few seconds.

If you have any issues deploying your node.js application please feel free to open up a Github support issues. We'll have someone get back to you in a flash!

## Usage

Jistsu is mostly self documenting. After installation, run the `jitsu` command from your command line. 

If it's your first time using `jitsu`, you will be prompted to login with an existing account or create a new account.

<img src="https://github.com/nodejitsu/jitsu/raw/master/test/promptscreenshot.png"/>

After you've logged in, you can start deploying apps immediately!

<img src="https://github.com/nodejitsu/jitsu/raw/master/test/screenshot.png"/>


## Command Line Usage

`jitsu` is mostly self-documenting. Try any of these commands to get started.


   **Usage:**
   
     jitsu <resource> <action> <param1> <param2> ...
   
   **Common Commands:**
   
   *Deploys current path to [Nodejitsu](http://nodejitsu.com)*
   
     jitsu deploy
   
   *Creates a new application on [Nodejitsu](http://nodejitsu.com)*
   
     jitsu create
   
   *Lists all applications for the current user*
   
     jitsu list
   
   *Additional Commands*
   
     jitsu apps
     jitsu snapshots
     jitsu users
     jitsu conf
     jitsu logout



### Help

Jitsu is mostly self documenting. We suggest just trying it out. All commands will yield friendly messages to you if you specify incorrect parameters. If you find anything difficult to use, please open up a Github issue or pull request! 

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
The [Nodejitsu](http://nodejitsu.com) team and friends have been building and using these tools actively for the past two years. They are the most used Node libraries (see: [http://search.npmjs.org/](http://search.npmjs.org/)) and are actively maintained. Each tool serves a specific function and we highly suggest you check each one out individually if you wish to increase your knowledge of Node.js

- [npm](http://npmjs.org) - Node Package Manager
- [colors](http://github.com/marak/colors) - Terminal Colors module
- [optimist](http://github.com/substack/optimist) - CLI Options Parsing
- [request](http://github.com/mikeal/request) - http request module
- [async](https://github.com/caolan/async) - Asynchronous Iteration
- [vows](http://vowsjs.org) - Asynchronous BDD testing library
- [winston](http://github.com/indexzero/winston/) - Multi-transport logging library

### Need more?
The documentation for `jitsu` and the [Nodejitsu](http://nodejitsu.com) APIs is open-source and a work in-progress. For more information checkout the [Nodejitsu Handbook](http://github.com/nodejitsu/handbook)

#### (C) Copyright 2010, [Nodejitsu](http://nodejitsu.com) Inc.