


# noc 
(**N**odejitsu **O**perations **C**ontroller)

## noc is a CLI tool for easily deploying node.js applications on the Nodejitsu platform 


## INSTALLATION

   sudo npm install noc
   
   
## USAGE

 1. Get an account.
 2. Prepare your application for deployment OR pick an app from the <a href="#marketplace">marketplace</a>.
 3. Boom! Deploy.


## User API


### Inviting a new user

    noc user invite [email]

*sends email to user with invite code*

### Creating a new user

    noc user create [username] [password] [email] [invite code]

*invite code is optional. If you don't provide a valid invite code, you will be provided one via email.*

### Confirming an account

    noc user confirm [invite code] 

*confirms a user account based on invite code*

### Resetting an account's password

    noc user reset [username]

*sends a reset password email to username*

### Managing SSH keys

    noc user keys [username]

*lists local path and location of all known .ssh keys for username*

### Adding SSH keys

    noc user keys [username] -a /pathTo/id_rsa.pub

### Removing SSH keys

    noc user keys [username] -r /pathTo/id_rsa.pub


## Application API

### Listing applications

    noc app ls|list 

*lists all the user's current applications*

### Starting / Stopping / Restarting applications

    noc app [appname] [start|stop|restart] 


## Deployment API

### Deploying a package.json from your local machine

     noc deploy /pathTo/myapp/

*/pathTo/myapp/ must point to a folder which contains a valid package.json <a href="#prepare">Read More</a>*

## Marketplace API

### Listing Marketplace applications

    noc market ls|list

### Deploying applications from the Marketplace

     noc market buy [appname]

*prompts user to specify a domain name / internal appname*

### Publishing your own application to the Marketplace

    noc market publish /pathTo/myApp

*/pathTo/myapp/ must point to a folder which contains a valid package.json <a href="#prepare">Read More</a>*

## PREPARING YOUR APPLICATION FOR DEPLOYMENT
<a name="prepare"/>
### Building a valid package.json

TODO:

## Specify your repository type

TODO:

## Specify your starting script

TODO:

## Ensure your npm dependencies are listed correctly

TODO:

## Bundle any dependencies which are not available on npm

TODO:

## THE MARKETPLACE

The Nodejitsu Marketplace is an store where you can purchase node.js applications. We currently have several free applications and are always accepting new ones!

TODO: 
