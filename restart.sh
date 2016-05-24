#!/bin/bash

forever stopall
forever start $1
forever list
