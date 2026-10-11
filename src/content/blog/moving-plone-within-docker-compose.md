---
title: Moving Plone within Docker Compose
description: Adding Plone to Docker Compose for a better developer environment
pubDate: 2026-10-31
updatedDate: 2026-10-11
heroImage: ''
tags:
  - plone
  - docker
  - developer-experience
---

At der Freitag, we are using all of the dev environment within the Docker except for our lovely Plone CMS setup. You may think that it is just a simple network wiring to be able to use docker services; but we had a couple of reasons to think that this was worth our time. Here in this article, I wanted to share with you the reasons, technical struggles, and how we approached it.

\# Why was it necessary?

It is not always justifiable to spend your precious hours if you can just work your way around it. We had been talking about this for some time now and finally felt like it was good time to make it come true.

\## Developer Experience

First of all, the ease of use was very important driving factor on this work. Setting up a new developer environment is always a pain. When using to a new computer or new developer joining your team; you have to spend hours on setting it up before starting to work on your tasks. Also, I thought it would be so cool if we can just spin up a dev environment simply with the \`docker compose up\` command.

\## Non-technical colleagues and external partners

Staging servers does work most of the time when you want to share a new feature that is ready but not deployed to the production yet, but there are some cases where it is not that convenient. Image a product manager that wants to see how far the feature has come. Deploying an unfinished feature to the staging server every time is a cumbersome job and it might not be available at the time. 

In last two years that I was working at derFreitag, there were many times that we have an external partner to or a freelance developer helping us build some service around our CMS. Until now, they were using the staging servers to test the API calls or connections, but we thought it would make things much smoother to just set up the whole suite in their local environment.

Long story short, we wanted anyone who is involved with our work to be able to see the CMS on their local. Now, after these changes, they only need to clone the repository and run a simple command. Easy, right?

\## Seemless integration with the rest of the services

This was arguably the most crucial reason that drove us for working on this. Even though we can establish a connection using the docker network, it is much simpler to connect all services within the docker compose file. In our case, we wanted to use Vinyl-Cache and Traefik containers for the local development and it was not possible to do it when the Plone works outside of the whole system. 

\# First solution: using a proxy container

The quickest solution we had come up with was to add a new container that works as a proxy between the Plone (that runs outside) and the rest of the containers. The idea is; containers thinks the Plone is working within the same docker compose but actually a special container carries these messages to Plone every time the connection is established.

I am planning to write about how to do this a separate post (just to keep the length in reasonable range) in detail. But as a short version, Nginx container that listens the docker network for the same port Plone is working on at outside, and relaying all the requests to the outside of the network. 

This quick solution helped us fix the 'seemless integration' issue. Idea is simple but effective and it kept us happy for a while. 

\# Final solution: create a container version of the Plone

Upstream Plone already has many Dockerized versions of the CMS but they not using 'Buildout'. Also, our system includes many
