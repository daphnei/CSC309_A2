# This shell script initializes the server and database with a set of simple
# blogs as recommended by the prof, spitting out the results of the API calls. 

if [ "$1" = "--remote" ]
then {
    myhost="redwolf.cdf.toronto.edu"
}
else {
    myhost="localhost" 
}
fi

echo "Initializing server on $myhost:31285"

curl -i -X POST -d blog=fastcompany.tumblr.com http://$myhost:31285/blog
curl -i -X POST -d blog=theatlantic.tumblr.com http://$myhost:31285/blog
#curl -i -X POST -d blog=condenasttraveler.tumblr.com http://$myhost:31285/blog
#curl -i -X POST -d blog=thisistheverge.tumblr.com http://$myhost:31285/blog
