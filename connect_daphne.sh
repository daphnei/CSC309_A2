#!/bin/sh
# Run this to easily connect to the db.
mysql -p -h dbsrv1 -u g1daphne csc309h_g1daphne
# Password is ???.
# Redirect input to one of the sql files to run them,
# e.g sh connect.sh < sql/tables.sql to recreate the tables
