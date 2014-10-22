Mirobot UI
==========
This is the web application that is served from the Mirobot WiFi module allowing it to be controlled.

Developing
----------
To do any development, first you'll need to install the dependencies. If you're not used to using Ruby and bundler,  assuming you already have Ruby installed, the process is to first install the bundler gem using:
```
gem install bundler
```
if you're on a unix based system you might need to use sudo. Then install all of the gems using:
```
bundle install
```
You can now run the test server which has a dummy websocket that emulates Mirobot by running:
```
./bin/test_server.rb
```

Buiding the binary
------------------
To build your own bin file you can run:
```
rake dist
```
to generate the bin file in the dist folder.

Uploading the binary
--------------------
Join the mirobot network and load the UI by visiting http://10.10.100.254/

If you're on a Windows machine you can visit http://10.10.100.254/iweb.html and then upload the new bin file (make sure you choose the correct part of the form: *Upgrade customized webpage*, not *Upgrade firmware*!)

If you're on a mac this doesn't currently work, so you need to use the uploader script in bin:
```
./bin/upgrade.sh
```
You should see a message saying the upgrade was successful and then the module should restart and after about 20 - 30 seconds you should be able to visit http://10.10.100.254 to see your new code. If it doesn't work first time, just keep  trying, it can be a little glitchy.
