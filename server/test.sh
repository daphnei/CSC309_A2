echo "
---------- Testing blog tracking ----------
" 

curl -i -X POST "localhost:31285/blog?blog=mspandrew.tumblr.com" # Should succeed
curl -i -X GET "localhost:31285/blog?blog=notch.tumblr.com" # Should return 404
curl -i -X POST "localhost:31285/blog?blog=notarealblogsahjflisadncuw.tumblr.com"
# Should still return 200, we don't check for valid blogs when tracking
curl -i -X POST "localhost:31285/blog?fnord=notch.tumblr.com" # Should return 400

echo "
---------- Testing retrieval of full trends ----------
" # Needs a database connection

curl -i -X GET "localhost:31285/blogs/trends?order=Trending" # Should succeed
curl -i -X GET "localhost:31285/blogs/trends?order=Recent" # Should succeed
curl -i -X GET "localhost:31285/blogs/trends?order=Trending&limit=5" # Should succeed
curl -i -X GET "localhost:31285/blogs/trends?order=Recent&limit=5" # Should succeed
curl -i -X POST "localhost:31285/blogs/trends?order=Trending" # Should return 404
curl -i -X GET "localhost:31285/blogs/trends" # Should return 400
curl -i -X GET "localhost:31285/blogs/trends?order=Potato" # Should return 400

