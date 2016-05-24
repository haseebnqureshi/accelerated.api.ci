#!/bin/bash


# Ensure ssh remote url exists on our repo. Since this script
# loads every time a pull is triggered, we can always ensure
# the process.env.CI_GIT_SSH_URL value will persist.

cd $1
git remote remove ssh
git remote add ssh $2
git remote -v


# If we find both our private and public key files where our
# application had instructed us via env.json, then we copy
# them over to our user's .ssh directory and set their 
# permissions. Otherwise, our pull will fail!

if [ -f $3 ] && [ -f $4 ]; then 

	if [ -f ~/.ssh/id_rsa ]; then
		chmod 644 ~/.ssh/id_rsa
	fi

	cp $3 ~/.ssh/id_rsa
	cp $4 ~/.ssh/id_rsa.pub
	chmod 400 ~/.ssh/id_rsa

	# ensuring bitbucket's hostnames are appropriately stored
	# @see: https://confluence.atlassian.com/bitbucket/use-the-ssh-protocol-with-bitbucket-cloud-221449711.html
	# @see: http://askubuntu.com/a/360056
	# we do that conditionally, so that we're not duplicating
	# our bitbucket host.

	BITBUCKET_HOST=$(ssh-keyscan -t rsa bitbucket.org)
	BITBUCKET_HOST_EXISTS=$(cat ~/.ssh/known_hosts | grep "$BITBUCKET")
	if [ ! "$BITBUCKET_HOST" = "$BITBUCKET_HOST_EXISTS" ]; then
		ssh-keyscan -t rsa bitbucket.org >> ~/.ssh/known_hosts
	fi

fi


