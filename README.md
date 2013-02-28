# jitsu [![Build Status](https://secure.travis-ci.org/nodejitsu/jitsu.png?branch=master)](http://travis-ci.org/nodejitsu/jitsu)
*Flawless command line deployment of Node.js apps to the cloud*

<img src="https://github.com/nodejitsu/jitsu/raw/master/assets/jitsu.png"/>

## Overview

[Jitsu](https://github.com/nodejitsu/jitsu) is a [Command Line Tool (CLI)](http://en.wikipedia.org/wiki/Command-line_interface) for managing and deploying Node.js applications. It's open-source and easy to use. [We've](https://github.com/nodejitsu) designed `jitsu` to be suitable for command line beginners, but still be powerful and extensible enough for production usage.

`jitsu` requires `npm`, the [node package manager](http://npmjs.org).

## One-line jitsu install

    [sudo] npm install jitsu -g

## Features

`jitsu` is built on some amazing technologies which we've been actively building with the community since 2009. `jitsu` is fully extendable and extremely modular ( see [Libraries](#Libraries) section ).

 - Allows for seamless deployment of your Node.js applications to the cloud
 - Ships with use-full boilerplates and sample applications through [Node Apps](https://github.com/nodeapps) project integration
 - Fully supports `npm` dependency resolution on deployment to [Nodejitsu](http://nodejitsu.com)
 - Full support of [Nodejitu's API](https://github.com/nodejitsu/nodejitsu-api) ( a plethora of node.js goodies )
 - Integrated multi-level multi-transport logging support via [Winston](https://github.com/flatiron/winston)
 - Too many to list... seek [further knowledge ](https://github.com/nodejitsu/handbook) or just try it out!


# One-Line Node App Installation

**If you don't have an application yet, you can use one of ours!**

     jitsu install

# One-Line Node App Deployment

     jitsu deploy

*( inside the path of your Node.js application )*


This will create a new application, package.json, and deploy your path to [Nodejitsu](http://nodejitsu.com). If it's your first deployment, you'll be prompted for some information such as *subdomain* and *start script* but it's really easy and we promise it will only take a few seconds.

If you have any issues deploying your node.js application please feel free to open up an issue on the [Github Issues](https://github.com/nodejitsu/jitsu/issues) section of this page, we'll have someone get back to you in a flash!

## Usage

`jitsu` is mostly self documenting. After installation, run the `jitsu` command from your command line.

If it's your first time using `jitsu`, you will be prompted to login with an existing account or create a new account.

<img src="https://github.com/nodejitsu/jitsu/raw/master/assets/login.png"/>

## After you've logged in, you can start deploying apps immediately!



## Command Line Usage

`jitsu` is mostly self-documenting. Try any of these commands to get started.


   **Usage:**
   
     jitsu <resource> <action> <param1> <param2> ...
   
   **Common Commands:**

   *To sign up for [Nodejitsu](http://nodejitsu.com)*

     jitsu signup

   *To log into [Nodejitsu](http://nodejitsu.com)*

     jitsu login

   *To install a pre-built application*

     jitsu install

   *Deploys application in the current path to [Nodejitsu](http://nodejitsu.com)*
   
     jitsu deploy
   
   *Lists all applications for the current user*
   
     jitsu list
   
   *Additional Commands*
   
     jitsu apps
     jitsu snapshots
     jitsu users
     jitsu logs
     jitsu databases
     jitsu conf
     jitsu logout



### Help

`jitsu` is mostly self documenting. We suggest just trying it out. All commands will yield friendly messages if you specify incorrect parameters. If you find anything difficult to use, please open up a [Github issue](https://github.com/nodejitsu/jitsu/issues) or pull request! 

     jitsu help
     jitsu help apps
     jitsu help snapshots
     jitsu help users
     jitsu help logs
     jitsu help databases
     jitsu help config

## .jitsuconf file

All configuration data for your local `jitsu` install is located in the *.jitsuconf* file in your home directory. Directly modifying this file is not really advised. You should be able to make all configuration changes via:

    jitsu config

If you need to have multiple configuration files, use --localconf or --jitsuconf options.

Some Examples:

    jitsu config set colors false   # disable colors
    jitsu config set timeout 480000 # set request timeouts to 8 minutes
    jitsu config set analyze false  # disable package analyzer
    jitsu config set protocol https # Always use HTTP Secure

##jitsu options

    jitsu [commands] [options]
 
    --version             print jitsu version and exit
    --localconf           search for .jitsuconf file in ./ and then parent directories
    --jitsuconf [file]    specify file to load configuration from
    --noanalyze           skip require-analyzer: do not attempt to dynamicially detect dependencies

##jitsu behind proxy

If you are behind a proxy and you haven't configured jitsu to use it, `jitsu` will throw an error, `Jitsu requires you to connect to Nodejitsu's stack (api.nodejitsu.com)`.
In order to solve this issue, you can configure jitsu to use a proxy by executing the following command.

    jitsu config set proxy http://proxy.domain.com:3128/

If you need to authenticate yourselves to the proxy, you can try this command.

    jitsu config set proxy http://user:pass@proxy.domain.com:3128/

<a name="Libraries"></a>

##jitsu hooks

You can add pre-deploy and post-deploy hooks to jitsu for running build scripts, tagging releases or anything else you want to do. These are hooks that are executed before or after deploying your application on the local machine. They are stored in your package.json:

    {
      "name": "test-app",
      "subdomain": "test-app",
      "scripts": {
        "predeploy": "echo This will be run before deploying the app",
        "postdeploy": "echo This will be run after deploying the app",
        "start": "app.js"
      },
      "engines": {
        "node": "0.6.x"
      },
      "version": "0.0.0"
    }

Which results in the following output when deploying:

    $ jitsu deploy
    info:    Welcome to Nodejitsu nodejitsu
    info:    It worked if it ends with Nodejitsu ok
    info:    Executing command deploy
    info:    Analyzing your application dependencies in app.js
    info:    Checking app availability test-app
    info:    Creating app test-app
    This will be run before deploying the app
    info:    Creating snapshot 0.0.0
    info:    Updating app test-app
    info:    Activating snapshot 0.0.0 for test-app
    info:    Starting app test-app
    info:    App test-app is now started
    info:    http://test-app.jit.su on Port 80
    This will be run after deploying the app
    info:    Nodejitsu ok

## Libraries
`jitsu` is built on a few well developed, well maintained Node.js libraries. The [Nodejitsu](http://nodejitsu.com) team and friends have been building and using these projects actively for the past two years. They are the most used Node libraries (see: [http://search.npmjs.org/](http://search.npmjs.org/)) and are actively maintained by Nodejitsu and other core members of the Node.js community. Each library serves a specific function and we highly suggest you check each one out individually if you wish to increase your knowledge of Node.js

- [npm](http://npmjs.org) - Node Package Manager
- [colors](https://github.com/marak/colors.js) - Terminal Colors module
- [optimist](https://github.com/substack/node-optimist) - CLI Options Parsing
- [request](https://github.com/mikeal/request) - http request module
- [async](https://github.com/caolan/async) - Asynchronous Iteration
- [vows](http://vowsjs.org) - Asynchronous BDD testing library
- [winston](https://github.com/flatiron/winston) - Multi-transport logging library

### Need more?
The documentation for `jitsu` and the [Nodejitsu](http://nodejitsu.com) APIs is open-source and a work in-progress. For more information checkout the [Nodejitsu Handbook](https://github.com/nodejitsu/handbook)

#### (C) Copyright 2010 - 2013, [Nodejitsu](http://nodejitsu.com) Inc.
