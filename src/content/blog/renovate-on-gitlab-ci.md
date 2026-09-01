---
title: Automated dependency updates on GitLab CI
description: A note on running Renovate as a scheduled pipeline
pubDate: 2026-09-22
updatedDate: ''
tags:
  - gitlab
  - ci
  - automation
---

GitLab has no Dependabot. That is the short version of why we ended up here.

Dependabot is a GitHub product, and there is no first-party equivalent on GitLab. GitLab's [dependency scanning](https://docs.gitlab.com/user/application_security/dependency_scanning/) sounds like it might be the thing, but it is a security feature: it tells you a dependency has a known vulnerability. It does not open a merge request that bumps it. Useful, but it leaves the actual updating to whoever remembers.

[Renovate](https://docs.renovatebot.com/modules/platform/gitlab/) fills that gap, and it has proper GitLab support rather than GitHub support with GitLab bolted on. This is a note on the CI side of setting it up.

