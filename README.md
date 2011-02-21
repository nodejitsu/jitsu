# jitsu
CLI tool for easily deploying node.js applications on the Nodejitsu platform 

## INSTALLATION

   sudo npm install noc
   
   
## OVERVIEW

 1. Get an account.
 2. Prepare your application for deployment OR pick an app from the <a href="#marketplace">marketplace</a>.
 3. Boom! Deploy.

## USAGE

After installation, simply run the "noc" command from your command line. If it's your first time using noc, you will be prompted to login with an existing account or create a new account.

## COMMAND LINE OPTIONS

### Help

     noc
 
*Just run the noc command without any arguments and it will display a help file.*

## Users

### Inviting a new user

    noc user invite [email]

*Sends invite code to user*

### Creating a new user

    noc user create [username] [password] [email] [invite code]

*Invite code is optional. If you don't provide a valid invite code, you will be provided one via email.*

### Confirming an account

    noc user confirm [invite code] 

*Confirms a user account based on invite code*

### Resetting an account's password

    noc user reset [username]

*Sends a reset password email to username*

### Managing SSH keys

    noc user keys [username]

*Lists local path and location of all known .ssh keys for username*

### Adding SSH keys

    noc user keys [username] -a /pathTo/id_rsa.pub

*Adds ssh key to logged in user*

### Removing SSH keys

    noc user keys [username] -r /pathTo/id_rsa.pub

*Removes ssh key from logged in user*

## Applications

### Listing applications

    noc app ls|list 

*Lists all the user's current applications*

### Starting / Stopping / Restarting applications

    noc app [appname] [start|stop|restart] 


## Deployment

### Deploying a package.json from your local machine

     noc deploy /pathTo/myapp/

*/pathTo/myapp/ must point to a folder which contains a valid package.json <a href="#prepare">Read More</a>*

## Marketplace

### Listing Marketplace applications

    noc market ls|list

### Deploying applications from the Marketplace

     noc market buy [appname]

*prompts user to specify a domain name / internal appname*


## Misc

### Logging out
    noc logout

*Logs out the current user and clears any stored credentials.*


## PREPARING YOUR APPLICATION FOR DEPLOYMENT
<a name="prepare"/>
### Building a valid package.json

TODO: add docs

## Specify your repository type

TODO: add docs

## Specify your starting script

TODO: add docs

## Ensure your npm dependencies are listed correctly

TODO: add docs

## Bundle any dependencies which are not available on npm

TODO: add docs

## THE MARKETPLACE

The Nodejitsu Marketplace is an store where you can purchase node.js applications. We currently have several free applications and are always accepting new ones!


TODO: add docs
