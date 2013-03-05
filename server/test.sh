curl -i -X POST "localhost:31285/blog?blog=mspandrew.tumblr.com" # Should succeed
curl -i -X GET "localhost:31285/blog?blog=notch.tumblr.com" # Should return 404
curl -i -X POST "localhost:31285/blog?blog=notarealblogsahjflisadncuw.tumblr.com"
# Should still return 200, we don't check for valid blogs when tracking
curl -i -X POST "localhost:31285/blog?fnord=notch.tumblr.com" # Should return 400
