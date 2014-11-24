Reviewer tool belt for [topcoder](http://topcoder.com).

## Install

(this is a work in progress, not ready for npm yet)

1. pull the code: git clone https://github.com/snowone/rbelt.git
1. npm install

## Usage

### Login

    bin/rbelt login

### List
Show all the review oppotunities for a given track.

    bin/rbelt list track_id [filter]

example: ```bin/rbelt list 14 open```

```list``` support filters: ```open```,```mine```,```all```. If no filter is set, it will be ```all```.