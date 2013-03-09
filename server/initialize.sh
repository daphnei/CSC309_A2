# This shell script initializes the server and database with a set of simple
# blogs as recommended by the prof, spitting out the results of the API calls. 

if [ "$1" = "--local" ]
then {
    myhost="localhost" 
}
else {
    myhost="redwolf.cdf.toronto.edu"
}
fi

echo "Initializing server on $myhost:31285"

curl -i -X POST "$myhost:31285/blog?blog=blog.fastcompany.com"
curl -i -X POST "$myhost:31285/blog?blog=theatlantic.tumblr.com"
curl -i -X POST "$myhost:31285/blog?blog=condenasttraveler.tumblr.com"
curl -i -X POST "$myhost:31285/blog?blog=thisistheverge.tumblr.com"
