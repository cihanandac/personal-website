---
title: Automated dependency updates on GitLab CI
description: A note on running Renovate as a scheduled pipeline
pubDate: 2026-11-01
updatedDate: ''
heroImage: ''
imageCredit: ''
imageAlt: ''
tags:
  - gitlab
  - ci
  - automation
---

GitLab has no Dependabot. That is the short version of why we ended up here.

Dependabot is a GitHub product, and there is no first-party equivalent on GitLab. GitLab's [dependency scanning](https://docs.gitlab.com/user/application_security/dependency_scanning/) sounds like it might be the thing, but it is a security feature: it tells you a dependency has a known vulnerability. It does not open a merge request that bumps it. Useful, but it leaves the actual updating to whoever remembers.

[Renovate](https://docs.renovatebot.com/modules/platform/gitlab/) fills that gap, and it has proper GitLab support rather than GitHub support with GitLab bolted on. This is a note on the CI side of setting it up.

## Running it as a pipeline

You don't install Renovate as an app. You run it as a job, on a schedule, from a repository that exists only for that purpose. Mend publish a CI template that does the work:

```yaml
include:
  - project: 'renovate-bot/renovate-runner'
    file: '/templates/renovate.gitlab-ci.yml'

variables:
  RENOVATE_EXTRA_FLAGS: '--autodiscover=false'
  RENOVATE_REPOSITORIES: '["group/project-one", "group/project-two"]'
  RENOVATE_MINIMUM_RELEASE_AGE: '7 days'
```

Three things make this work, and none of them are in the file:

**A scheduled pipeline.** Settings → CI/CD → Pipeline schedules. Without one the job never runs, and the repository just sits there looking configured. This is the step that is easy to skip, because everything looks complete without it.

**A token.** A CI/CD variable holding a token with `api` and `write_repository` scope. Renovate needs to read the repositories it scans and push branches and merge requests into them, so this token's access is the real boundary of what the bot can touch. Worth being deliberate about whose account it belongs to — a project access token or a dedicated bot user ages better than someone's personal token, which stops working the day they change roles.

**A list of repositories.** Renovate can autodiscover everything the token can see, which is a fast way to open merge requests on repositories nobody asked you to touch. Turning autodiscovery off and naming the repositories explicitly means adding a line when you onboard a project — which is the point. Opting in is a decision; opting out is cleanup.

## Settings that decide how annoying it is

The default behaviour is thorough, and thorough is not what you want landing in a team's merge request list every morning. Most of the tuning is about volume.

`prConcurrentLimit` caps how many merge requests are open at once. Without it, switching Renovate on for a repository that has not been updated in a year produces a wall of merge requests and everyone starts ignoring the bot on day one.

`RENOVATE_MINIMUM_RELEASE_AGE` makes it wait before proposing a version. A week is enough for a bad release to get yanked or patched, and you stop being the person who finds out.

The [dependency dashboard](https://docs.renovatebot.com/key-concepts/dashboard/) gives you one issue per repository listing everything Renovate would like to do, including what it is holding back. It turns "why has it not updated this" from an investigation into a link.

Grouping related packages into a single merge request is the other big one. Anything that has to move together — a framework and its ecosystem, a test runner and its plugins, linters — is less work as one merge request than as six that each fail on their own.

Reviewers can be set from the runner config too, so the merge requests arrive assigned rather than unowned. An unassigned bot merge request is a merge request nobody merges.

## What I would tell myself at the start

The CI part is genuinely small — an include, a handful of variables, a schedule. What takes the time is deciding how much noise the team will tolerate, and that is worth thinking about before you enable it everywhere rather than after.

Turning it on for one repository first, living with it for a couple of weeks, and only then adding the rest to the list is slower and much better. The failure mode here is not a broken pipeline, it is a bot that everybody has learned to scroll past.

The [configuration options](https://docs.renovatebot.com/configuration-options/) page is long, and the per-repository half of this — which packages to group, what to pin, what to never bump automatically — deserves its own note.
