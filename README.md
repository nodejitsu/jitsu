# jitsu
CLI tool for easily deploying node.js applications on the Nodejitsu platform 

## Installation

   [sudo] npm install jitsu
      
## Overview

 1. Get an account [at Nodejitsu](http://nodejitsu.com).
 2. Prepare your application for deployment.
 3. Boom! Deploy.

## Features

 - Allows for seamless deployment of your Node.js applications to the cloud
 - Command Line Interface (CLI) maps directly to Nodejitu's public API
 - Fully supports NPM dependency resolution on deployment to Nodejitsu
 - We built this CLI using some amazing technologies, this allows jitsu to be fully extendable and extremely modular ( see Libaries section)

## Usage

After installation, simply run the `jitsu` command from your command line. If it's your first time using `jitsu`, you will be prompted to login with an existing account or create a new account.

## Command Line Options

### Help

     jitsu help
     jitsu help apps
     jitsu help snapshots
     jitsu help users
     jitsu help config

### Need more?
The documentation for `jitsu` and the Nodejitsu APIs is open-source and a work in-progress. For more information checkout the [Nodejitsu Handbook](http://github.com/nodejitsu/handbook)

#### (C) Copyright 2010, Nodejitsu Inc.