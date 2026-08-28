---
title: How to Containerize Your Application
description: My notes on how to containerize your application
pubDate: 2026-08-20
updatedDate: 2026-08-27
heroImage: /src/assets/hero-01-containerize.png
tags:
  - docker
  - containers
---

## Dockerfile

To build the image, you need a Dockerfile.

- It is a text file with step-by-step instructions for building your containerized application.
- The name `Dockerfile` is just a convention. You can name it something else, but then you have to point at it with the `-f` flag on the `docker build` command. e.g. `docker build -f my-docker-file .`

### A basic Dockerfile

Let's look at a basic Dockerfile (example from the [Docker docs](https://docs.docker.com/get-started/workshop/02_our_app/#build-the-apps-image)):

```dockerfile
# syntax=docker/dockerfile:1

FROM node:24-alpine
WORKDIR /app
COPY . .
RUN npm install --omit=dev
CMD ["node", "src/index.js"]
EXPOSE 3000
```

### Dockerfile instructions

`FROM` : specifies the base image you are building on top of. In `node:24-alpine`, `node` is the image name and `24-alpine` is the tag: Node.js 24 on top of Alpine Linux, a small distribution that keeps the image size down.

`WORKDIR` : sets the working directory inside the container, and creates it if it doesn't exist. Every instruction after this one runs relative to that path, and it is where you land if you open a shell in the container.

`COPY` : copies files from your machine into the image. `. .` copies everything in the build context, which is usually not what you want; it drags in `node_modules`, `.git`, local env files and anything else lying around. Rather than listing files one by one, add a `.dockerignore` file; it works like `.gitignore` and keeps that content out of the build entirely.

`RUN` : runs a command **while the image is being built**, and each one adds a layer to the image. This is the main difference from `CMD`: `RUN` happens once, at build time; `CMD` happens every time you start a container. Here it installs the dependencies so they are baked into the image.

Layer order matters because Docker caches each one. If you copy your whole project before installing dependencies, then any change to any file invalidates the cache and reinstalls everything. Copying the manifests first is usually worth it:

```dockerfile
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY . .
```

`CMD` : sets the default command for starting the application. When someone runs this container without specifying a command, this is what runs. If you run `docker run myimage npm test`, then `npm test` replaces it. Only the last `CMD` in a Dockerfile takes effect.

`EXPOSE` : documents which port the application listens on. It is worth being clear about this one, because the name suggests more than it does: on its own it does **not** make the port reachable from your machine. It is metadata for whoever reads the Dockerfile or inspects the image. To actually reach the application you publish the port when you run the container:

```bash
docker run -p 3000:3000 my-containerised-app
```

The first number is the port on your machine, the second is the port inside the container.

## Building the image

To build the image, run:

```bash
docker build -t my-containerised-app .
```

The `.` at the end is the build context, the directory Docker sends to the builder and resolves `COPY` paths against. It is not the location of the Dockerfile, although the two are usually the same directory, which is why this reads as "build from here".

We are not naming the Dockerfile here because Docker looks for a file called `Dockerfile` in the context by default. If it is named something else, or lives somewhere else, point at it explicitly:

```bash
docker build -f /path/to/context/dir/Dockerfile /path/to/context/dir
```

### Adding a tag

The `-t` flag names the image. Without it the image is still built, but it ends up with `<none>` for both the name and the tag, and you have to refer to it by its image ID, which is why it is worth getting into the habit.

If you already built an image without a tag, you can add one afterwards:

```bash
docker image tag <image-id> another-username/another-image:v1
```

A tag is just a label pointing at an image, so one image can carry several. If you leave the tag off, Docker assumes `latest`, which is a name rather than a promise: nothing about it guarantees the image is actually the newest one.

## Publishing images

Images are stored in registries. The most common one is Docker's own: [hub.docker.com](https://hub.docker.com/). If you would rather keep them next to your code on GitHub or GitLab, both offer their own registries.

If you are not the only person using this containerized app, it makes sense to build it once and pull the same image everywhere, rather than each machine building its own.

Note: images don't have to be public. You can keep them private and require credentials to pull.

### Pushing to Docker Hub

If this is your first time, create an account on Docker Hub: [Sign-up](https://app.docker.com/signup). Then authenticate from your terminal with `docker login`.

The image name has to match the destination, so it needs your username in front of it. If you tagged it as just `my-containerised-app`, retag it first:

```bash
docker image tag my-containerised-app my-username/my-image:v1
docker push my-username/my-image:v1
```

Once the push finishes, the image is available on Docker Hub and anyone with access can `docker pull` it.

### Pushing to GitLab

A container registry is built into each GitLab project. The documentation is worth a read: [docs.gitlab.com/user/packages/container_registry](https://docs.gitlab.com/user/packages/container_registry/)

> **Tip:** an administrator must enable the container registry for your GitLab instance. For more information, see [GitLab container registry administration](https://docs.gitlab.com/administration/packages/container_registry/).

`docker push` still does the work, but the image name has to start with the registry host instead of just a username:

```bash
docker login registry.example.com
docker push registry.example.com/group/project/image
```

## Building the image in CI

Offloading the build to CI is usually a good idea once more than one person is involved. You get the same image regardless of whose laptop is around, the build runs on every commit or tag without anyone remembering to do it, and credentials for the registry live in the CI settings instead of on individual machines.

On GitLab, the registry variables are already there for you:

```yaml
build:
  image: docker:cli
  services:
    - docker:dind
  script:
    - docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
    - docker build -t "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
```

Tagging with the commit SHA rather than `latest` means every image can be traced back to the exact code that produced it, which matters the first time you need to work out what is actually running in production.

## Building for different machines

An image is built for a specific CPU architecture. If you build on an Apple Silicon Mac you get an `arm64` image, and if your server is a normal cloud VM it probably wants `amd64`. Pushing the first to the second gives you either a flat refusal to start or, worse, something that limps along under emulation.

### Docker buildx

`buildx` is the build engine that can produce an image for several architectures at once. It ships with Docker Desktop, so there is usually nothing to install.

Multi-platform builds need a builder that isn't the default one:

```bash
docker buildx create --name multi --use --bootstrap
```

Then build for both architectures and push in the same step:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t my-username/my-image:v1 \
  --push .
```

The `--push` is doing something load-bearing here. A multi-platform build produces several images plus a manifest tying them together, and your local image store can only hold one architecture at a time, so `--load` works for a single platform but not for the pair. Push it and the registry keeps the whole set, then each machine pulls the one that matches it without you thinking about it.
