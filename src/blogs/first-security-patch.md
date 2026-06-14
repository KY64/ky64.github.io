---
layout: 'blog.njk'
title: Exploiting And Patching Hidden Path Traversal Issue
description: Who knows a hidden path traversal bug in an open-source AI coding tool enabled arbitrary file overwrites
tags: blog
date: 2026-06-14
---

# Exploiting And Patching Hidden Path Traversal Issue

I was contributing to a project called [Letta Code](https://github.com/letta-ai/letta-code). Previously, I nudged
the team to merge a pending security [patch](https://github.com/letta-ai/letta-code/pull/2577) after making a POC
for it. Once the patch is merged, I pulled the latest source to be reviewed by AI to verify if there is no more
issue related to `letta --import`.

There is one more, it says.

Before discussing the issue, let's understand what `letta --import` is. I've briefly explained how Letta
import works on previous [post](../first-exploit-poc#going-red). I'll copy paste here for convenient and
we can focus on what is the issue.

## Letta 'Import' Feature

Letta Code has a feature to import an agent. It is by importing **.af** file or so called [Agent File](https://docs.letta.com/guides/core-concepts/agent-file).
_"It provides a portable way to share agents with persistent memory and behavior across different environments."_
according to their docs. There are two ways to import an agent, from a file or Letta registry. User only need
to run

```
# import from local file
letta --import <filepath>

# import from Letta registry
letta --import <@author/name>
```

then it will import the agent memory, skills, and personality to be available in the user machine. Let's
focus on the skills part. The agent file include `skills` section to tell what skills the agent have.
There are 2 ways to import skill, from filepath and from GitHub repository. I'm focusing the example for
importing skill from filepath. It looks like this

```json
{
  "name": "my-skill",
  "files": {
      "SKILL.md": "My skill is creating a new skill",
      "references/principle.md": "This is my principle to learn a new skill"
  }
}
```

When Letta saw this section, it will create a folder inside **~/.letta/agents/<agent-id>/memory/skills** which
follows the configuration above, in this case **my-skill**. Inside that folder would be anything that is
stated on `files` like **SKILL\.md** and a folder **references** which contain **principle\.md** file. So in the end it looks like
this
