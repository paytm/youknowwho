#
## My Fancy Node.js project
#
#
#PROJECT = "My Fancy Node.js project"


all: install test

test: ;@echo "Testing ${PROJECT}....."; \
			npm test;

install: ;@echo "Installing ${PROJECT}....."; \
			npm install

update: ;@echo "Updating ${PROJECT}....."; \
			git pull --rebase; \
				npm install

clean : ;
		rm -rf node_modules


.PHONY: test install clean update
