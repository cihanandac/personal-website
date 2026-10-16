---
title: Automated dependency updates on GitLab CI
description: A note on running Renovate as a scheduled pipeline
pubDate: 2026-11-01
updatedDate: ''
heroImage: ../../assets/blog/the_alchemists_studio_1544bp09p_0_k643b139z_download_medium.jpeg
imageCredit: Thomas, Gérard, The Alchemist's Studio 1663-1720
imageAlt: Image depicts a studio of an alchemist.
tags:
  - gitlab
  - ci
  - automation
---

Updating project dependencies has never been one of my favorite activities. Do it manually, and you might spend countless hours meddling with the package requirements and still end up with a broken CI. Maintaining multiple projects with a small team is sometimes makes this unmanageable; I have seen many projects that have given up on the job of updating dependencies until things stop working.

Our team of three at der Freitag never came to that point thanks to [Gil Forcada](https://github.com/gforcada)'s idea of setting aside one Friday every month for only the dependency updates but it was certainly not everyone's favorite day of the month. 

In the end, these struggles led us to give automated dependency update tools a try. We already knew about [Dependabot](https://github.com/dependabot), one of the most famous dependency tools. But Dependabot only works on the Github and since we are using Gitlab for most of the der Freitag repositories it was  not an option for us. 

GitLab's [dependency scanning](https://docs.gitlab.com/user/application_security/dependency_scanning/) sounds like it might be the useful in this situation, but it is a security feature: it tells you a dependency has a known vulnerability; It does not open a merge request that bumps it. Useful, but it leaves the actual updating to whoever remembers. [Renovate](https://docs.renovatebot.com/modules/platform/gitlab/) fills that gap, it has proper GitLab (and [Codeberg](https://codeberg.org/)) support and it is working great.

At first, we wanted to dip our toes and only run it for one React and one Django repository, but not after long we ended up installing it for most of the repositories. Currently Dependabot runs on schedule everyday and creates automated merge requests (Yes, Gitlab calls it merge request instead of pull request), marks security releases, groups certain packages according to the config file, and even auto-merges (for now only dev-dependencies and patch releases but more on that later).

## How to setup and run Renovate

In this section, I will try to explain technical parts on how to use the Renovate on your Gitlab.

### Create Renovate Repository

You don't need to install Renovate as an app, but instead you need to create a repository (we called it renovate-runner) and add a Gitlab CI file to this repository. We will run Renovate from this repository on schedule.

On the `.gitlab-ci.yml` file:

```yaml
include:
  - project: "renovate-bot/renovate-runner"
    file: "/templates/renovate.gitlab-ci.yml"

variables:
  RENOVATE_EXTRA_FLAGS: "--autodiscover=false"
  RENOVATE_REPOSITORIES: '[
    "your-organisation/your-repository",
    "your-organisation/your-other-repository",
  ]'
  RENOVATE_REVIEWERS: '["you", "your-colleague"]'
```

**Include** section is stating the project and what template is used. You can check the other templates and the details on renovate's own gitlab repository [**here**](https://gitlab.com/renovate-bot/renovate-runner/). But without much hassle, you can just use this exact statement.

**RENOVATE_REPOSITORIES** part is where we describe the repositories that it should run the updates on. We need to add a detailed config for each of repository separately but more on this below. Renovate can `autodiscover` other repositories on your organization as long as it has the authorization to see those, but currently we turned the auto-discover off in order be more in control.

**RENOVATE_REVIEWERS** tells Renovate who it should add as a reviever after creating the merge requests.

## Create an Access Token

There are three ways to give access to the Renovate; personal access token, project access token, group access token. We have choose to use the group access token for our organization but I assume there is not much difference in terms of usage or security, but more of a preference. You can follow [this](https://docs.renovatebot.com/modules/platform/gitlab/#authentication) documentation section if you would like to use other options.

For the group access token, on the organization main page, we will click the **`Settings -> Access token`** and then click on \*\*`Add new token` button. This token needs to have at least permissions to create issues and merge requests, for this we need to give the role of `Developer` to this group. Gitlab automatically will create a bot for this group at the first run of the Gitlab CI and we will see this bot on the Renovate merge requests.

## Scheduling the Pipeline

We can manually run a pipeline but being a developer means we are lazy, so we want to schedule things. For this, on the renovate-runner repository of your own, click **`Settings → CI/CD → Pipeline schedules -> New Schedule`** and create one that you think is manageable, for a start I recommend running it once a week so that you can spare one day of yours to review and merge the MRs. 

## How to Configure each Repository

Renovate comes with some default [configurations](https://docs.renovatebot.com/config-overview/) for the different types of projects. You can change this config and set up different behaviors. This config will make the most difference on how you will enjoy your following days, so I suggest you taking your time to fine tune each project to your exact need.

There is a global config that you can set up for all of your repositories or you can create one specific config per repository. For adding things global config, you can change it directly in the renovate-runner repository gitlab CI file. For example, if I want to change the minimum release time to 2 weeks before considering a package good for updating, I should add the following file to the gitlab-ci.yml file. Check the rest of the default config from the documentation.

```json
  RENOVATE_MINIMUM_RELEASE_AGE: "14 days"
```

For the repository specific configuration, we have to add a `renovate.json` file to the root of the repository. This file is also getting created automatically in the first renovate pipeline if it doesn't exist but you have to change this file to your specific needs. Here are an example config I think includes some important functionality.

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:best-practices",
    "abandonments:recommended",
    ":dependencyDashboard",
    ":automergePatch"
  ],
  "osvVulnerabilityAlerts": true,
  "vulnerabilityAlerts": {
    "minimumReleaseAge": null,
    "prCreation": "immediate"
  },
  "prConcurrentLimit": 5,
  "rebaseWhen": "behind-base-branch",
  "labels": ["type::chore"],
  "major": {
    "dependencyDashboardApproval": true
  },
  "packageRules": [
    {
      "abandonmentThreshold": "1 year",
      "matchPackageNames": ["*"]
    },
    {
      "matchDepTypes": ["devDependencies"],
      "matchUpdateTypes": ["minor", "patch"],
      "groupName": "dev minor+patch",
      "automerge": true
    }
  ]
}
```

## Tips and Tricks for Easier Management of Updates

`prConcurrentLimit` caps how many merge requests are open at once. Without it, switching Renovate on for a repository that has not been updated in a year produces a wall of merge requests (which can result everyone starts ignoring it on day one). Instead we are limiting it to 5 for most of our repositories. This allows us to keep the merge requests at a manageable level.

We turned `osvVulnerabilityAlerts` on, because this allows us to see the security alerts separate on the dashboard. It is important to get these merged as soon as possible and they shouldn't disappear within tons or existing updates. Also, don't forget to turn `prCreation` to immediate for the `vulnerabilityAlerts`, because you don't want an important security update to be capped because of the `prConcurrentLimit` that we just set. 

`RENOVATE_MINIMUM_RELEASE_AGE` makes it wait before proposing an update. It is a possibility that the new release of a package has a bug or a vulnerability, therefore giving it at least a week is important before merging. We have seen a lot of `supply chain attacks` for the open source projects in the last couple of years which makes this feature even more important. 

`:dependencyDashboard` extention makes renovate create a [dependency dashboard](https://docs.renovatebot.com/key-concepts/dashboard/) inside an issue per repository that lists everything that Renovate finds or wants. This report includes what is holding Renovate back from successfully making an update which was an important tool for debugging issues for us. 

`packageRules` us another important time saver. It allows you to group things that has to move together (a framework or its ecosystem, a test runner and its plugins, linters etc). That means less work as one merge request than as six separate merge request that is needed to be rebased and merged.

`RENOVATE_REVIEWERS` can be set from the runner config, so the merge requests arrive assigned to specific people. We think that this is helpful for the visibility of the MRs and leaving the reviewer part empty might cause some MRs to be ignored.
