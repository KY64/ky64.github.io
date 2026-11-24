---
layout: 'blog.njk'
title: Amateur Analysis of SCADA Software CVE
description: Analyzing three CVEs on SCADA software authentication with a 3rd party integration
tags: blog
date: 2026-11-23
---

# Amateur Analysis of SCADA Software CVE

I'm experimenting with something beyond my expertise. Exploring a totally new field which I have no prior knowledge about.
This time I'm reading about Common Vulnerabilities and Exposures (CVE) report in an open-source project I found in Github.
The project that I'm looking at is [FUXA](https://github.com/frangoteam/FUXA). A web-based SCADA (Supervisory Control and
Data Acquisition) software that allows us to build modern dashboards to monitor connected machines using standard protocols.

I'm interested in this project because I'm currently building my experience in ICS (Industrial Control System) security from
zero. This is intriguing since I finished reading [Countdown to Zero Day](https://www.goodreads.com/en/book/show/18465875-countdown-to-zero-day)
by Kim Zetter. It was a mind-blowing read, I didn't know how lines of code could be used to sabotage a nuclear-plant which had
full of heavy mechanics and not exposed to the internet. Since my background is full-stack web development and I learned a
little bit of embedded system during college, I started from the most familiar part about ICS: the web UI and
connector integration. I find FUXA as a suitable starting point for me to learn about SCADA software.

## Reading CVE Report

The first CVE I was reading on was security bypass vulnerability using path manipulation ([GHSA-p69w-mmfv-xrfj](https://github.com/frangoteam/FUXA/security/advisories/GHSA-p69w-mmfv-xrfj)).
This could happen when we access a protected endpoint then manipulating the original path of the URL to bypass it. For this case,
it was endpoint to access [Node-RED](https://nodered.org/) feature to manipulate flows of a project. Node-RED is a low-code
development tool to build automation or industrial control system. My experience on this tool is very limited, I knew it since
one of my friend in the past used this to prototype his final project in college. However, the vulnerability here is not on
the Node-RED but the *connector*, the part which makes it possible for FUXA to integrate with Node-RED.

### Path Manipulation Vulnerability

FUXA has monolithic architecture, a client and a server run as a single process and accessed through a single port. Although the
code component is modular (client and server are different component), it is deployed as a single unit.

<figure>
  <img src="/images/analyzing-scada-software-cve/fuxa-client-server-architecture.png" 
       alt=""
  >
  <figcaption>Figure 1. Simplified Fuxa Client Server Architecture</figcaption>
</figure>

The architecture shown on Figure 1 is trimmed down version of FUXA application architecture. FUXA doesn't just support Node-RED
but also Siemens S7, and other standard industrial protocols. We're focusing on Node-RED since the CVE is related to this
connector.

Accessing the Node-RED feature can be done by calling `/nodered` path. Although there are several paths, we are focusing on crucial
one, which is `/nodered/flows`. The [endpoint](https://nodered.org/docs/api/admin/methods/post/flows/) `/nodered/flows` deploys
a flow configuration which may have function nodes that could execute arbitrary server-side JavaScript when triggered. We can
say *flow* the same as source code in programming but since Node-RED is a low-code visual programming tool, the file is
called '[flow](https://nodered.org/docs/user-guide/concepts)'.


