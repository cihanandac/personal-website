---
title: Containerize your application
description: My notes on how to containerize your application
pubDate: 2026-09-01
updatedDate: ''
heroImage: ../../assets/blog/containers.jpeg
tags:
  - docker
  - containers
---

# Dockerfile

To build the image, you need to use Dockerfile.

- It is a text-based file for step-by-step instructions to build your containerized application.
- The name `Dockerfile` is just by convention. You can name it something different but if that is the case you need to specify the file name at 'docker build' command with 'f' flag. e.g. `docker build -f my-docker-file .`

## Basic Dockerfile

Lets look at a basic Dockerfile (example from this [dockerdocs](https://docs.docker.com/get-started/workshop/02_our_app/#build-the-apps-image))

```plain
# syntax=docker/dockerfile:1

FROM node:24-alpine
WORKDIR /app
COPY . .
RUN npm install --omit=dev
CMD ["node", "src/index.js"]
EXPOSE 3000
```

## Dockerfile instructions

`FROM` : to specify the base image of docker. Even though it says 'node:24-alpine' it means that this is a lightweight Linux image with Node.js pre-installed.

`WORKDIR` : to setting up the working directory inside the container. When you get in the container, this is where all the files will be living.

`COPY` : to copy the files from your file system (still uncontainerised at this point) to the container image. If you add '. .' it means it copies everything from the file system inside the container, which might be something that you do not wanna do, copy only the essential files in order to keep your container lightweight.

`RUN` : to give command to will be run inside the container (in this case it is lightweight linux called node:24-alpine). On the complex build files, there might be multiple steps to run. In this example it is installing the necessary dependencies.

`CMD` : creates a command for starting this application. When later someone runs this container without specifying a command, this will be the one that is run. If you run the container with 'docker run myimage npm test', then npm test command overwrites this command.

`EXPOSE` : makes the port that is specified here accessible. By default, the ports living in the container are separate from the ones on the host machine. And if you don't expose container's ports, you will not be able to access them later from your host machine.

# Building the image

In order to build the container image, by convention, we need to be in the same directory with the `Dockerfile`.

```plain
docker build -t my-containerised-app .
```

In this command, we are not specifying the docker files because it is assuming that you are using the name `Dockerfile`, but if you are using a different name, or you are in a different path than the file itself, you this command.

```plain
docker build -f /path/to/context/dir/Dockerfile /path/to/context/dir
```

### Adding tag

`-t` flag is for adding the tag. If you don't add this, Docker will automatically add a less human-readable name for you.
If you already created an image without the tag, you can fix this later by adding a second tag to the image.

```plain
docker image tag my-username/my-image another-username/another-image:v1
```

# Publishing images

Images can be stored in the registries. Most common one that is used for this purpose is the Docker's own registery: [hub.docker.com](https://hub.docker.com/). Or if you wanna keep it within your Github/Gitlab, it is also possible.
If you are not the sole user of this containerized app, then it would make sense to build it once, and use it in different places.

Note: It doesn't have to be public, you can keep it private and only accessible with credentials.

## How to push your image to the docker hub.

If this is your first time using it, you have to create a user in the docker hub: [Sign-up](https://app.docker.com/signup).
Then, on your terminal, you should use `docker login` command to authenticate.

In order to push your already build (locally) container image, you can use the `docker push` command.

```plain
docker push my-username/my-image
```

After successfully, pushing the image to the Docker hub.

## How to push your image to Gitlab

Container registries are integrated within the each Gitlab project. Check following documentation to understand it a bit better: [docs.gitlab.com/user/packages/container_registry](https://docs.gitlab.com/user/packages/container_registry/)

> !Tip
> An administrator must enable the container registry for your GitLab instance. For more information, see [GitLab container registry administration](https://docs.gitlab.com/administration/packages/container_registry/).

Same command for the docker push is still valid here, but instead of using `username/image-name`, we need to state the registries name as well.

```plain
    docker push registry.example.com/group/project/image
```

# Building the image with the CI

Offloading the building process to the CI might be nice idea for big projects. By choosing this you can

# Building container image for different machines

## Docker buildx
