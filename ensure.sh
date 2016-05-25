#!/bin/bash


# Make sure forever is installed
echo "Making sure forever is installed globally..."
sudo npm install forever -g


# Ensure ssh remote url exists on our repo. Since this script
# loads every time a pull is triggered, we can always ensure
# the process.env.CI_GIT_SSH_URL value will persist.

echo "Re-adding SSH remote url onto your git repo..."
cd $1
git remote remove ssh
git remote add ssh $2
git remote -v


# If we find both our private and public key files where our
# application had instructed us via env.json, then we copy
# them over to our user's .ssh directory and set their 
# permissions. Otherwise, our pull will fail!

if [ -f $3 ] && [ -f $4 ]; then 

	if [ ! -f ~/.ssh ]; then
		mkdir ~/.ssh
	fi

	if [ ! -f ~/.ssh/id_rsa ]; then
		touch ~/.ssh/id_rsa
	fi

	if [ ! -f ~/.ssh/id_rsa.pub ]; then
		touch ~/.ssh/id_rsa.pub
	fi

	if [ ! -f ~/.ssh/known_hosts ]; then
		touch ~/.ssh/known_hosts
	fi

	if [ -f ~/.ssh/id_rsa ]; then
		chmod 644 ~/.ssh/id_rsa
	fi

	echo "Copying private and public keys into user's .ssh directory..."
	cp $3 ~/.ssh/id_rsa
	cp $4 ~/.ssh/id_rsa.pub
	chmod 400 ~/.ssh/id_rsa

	# ensuring bitbucket's hostnames are appropriately stored
	# @see: https://confluence.atlassian.com/bitbucket/use-the-ssh-protocol-with-bitbucket-cloud-221449711.html
	# @see: http://askubuntu.com/a/360056
	# we do that conditionally, so that we're not duplicating
	# our bitbucket host.

	echo "Checking whether bitbucket.org's listed in known_hosts..."
	BITBUCKET_HOST=$(ssh-keyscan -t rsa bitbucket.org)
	BITBUCKET_HOST_EXISTS=$(cat ~/.ssh/known_hosts | grep "$BITBUCKET")
	if [ ! "$BITBUCKET_HOST" = "$BITBUCKET_HOST_EXISTS" ]; then
		echo "Adding bitbucket.org's host into known_hosts..."
		ssh-keyscan -t rsa bitbucket.org >> ~/.ssh/known_hosts
	fi

fi


