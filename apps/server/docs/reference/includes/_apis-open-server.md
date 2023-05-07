
<h1 id="api">API v1.0.0</h1>

> 下滑查看接口示例。

API description

Base URLs:

* <a href="http://127.0.0.1:3000">http://127.0.0.1:3000</a>

* <a href="http://localhost:3000">http://localhost:3000</a>

# 认证

- HTTP Authentication, scheme: bearer

- HTTP Authentication, scheme: basic

* API Key (cookie)
    - Parameter Name: **connect.sid**, in: cookie. 

<h1 id="api-hash">Hash</h1>

## HashController_digest

<a id="opIdHashController_digest"></a>

> 代码示例

```javascript
const inputBody = '{
  "data": "string",
  "encoding": "raw"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('http://127.0.0.1:3000/hash/digest', {
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
POST http://127.0.0.1:3000/hash/digest HTTP/1.1
Host: 127.0.0.1:3000
Content-Type: application/json
Accept: application/json

```

```shell
# 也可以用 wget
curl -X POST http://127.0.0.1:3000/hash/digest \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

`POST /hash/digest`

> Body parameter

```json
{
  "data": "string",
  "encoding": "raw"
}
```

<h3 id="hashcontroller_digest-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|body|body|[HashDigestRequest](#schemahashdigestrequest)|true|none|

> 响应示例

> 200 响应

```json
{
  "base64": "string",
  "sha1": "string",
  "sha256": "string",
  "sha384": "string",
  "sha512": "string"
}
```

<h3 id="hashcontroller_digest-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[HashDigestResponse](#schemahashdigestresponse)|

<aside class="success">
不需要认证
</aside>

<h1 id="api-password">Password</h1>

## Generate random password

<a id="opIdGenerateController_generate"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/password/generate', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/password/generate HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/password/generate

```

`GET /password/generate`

<h3 id="generate-random-password-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|n|query|number|false|none|
|length|query|number|false|none|
|numbers|query|boolean|false|Should the password include numbers|
|lowercase|query|boolean|false|Should the password include lowercase characters|
|uppercase|query|boolean|false|Should the password include uppercase characters|
|excludeSimilarCharacters|query|boolean|false|Should exclude visually similar characters like "i" and "I"|
|exclude|query|string|false|List of characters to be excluded from the password|
|strict|query|boolean|false|Password should include at least one character from each pool|

<h3 id="generate-random-password-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## Check password by zxcvbn

<a id="opIdZxcvbnController_zxcvbnFromPath"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/password/zxcvbn/{password}', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/password/zxcvbn/{password} HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/password/zxcvbn/{password}

```

`GET /password/zxcvbn/{password}`

<h3 id="check-password-by-zxcvbn-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|password|path|string|true|none|

<h3 id="check-password-by-zxcvbn-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

<h1 id="api-misc">Misc</h1>

## SemverController_parse

<a id="opIdSemverController_parse"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/semver/{version}?clean=true&coerce=true', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/semver/{version}?clean=true&coerce=true HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/semver/{version}?clean=true&coerce=true

```

`GET /semver/{version}`

<h3 id="semvercontroller_parse-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|version|path|string|true|none|
|clean|query|boolean|true|none|
|coerce|query|boolean|true|none|

<h3 id="semvercontroller_parse-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## WhoamiController_whoami_get

<a id="opIdWhoamiController_whoami_get"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/whoami', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/whoami HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/whoami

```

`GET /whoami`

<h3 id="whoamicontroller_whoami_get-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## WhoamiController_whoami_post

<a id="opIdWhoamiController_whoami_post"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/whoami', {
  method: 'POST'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
POST http://127.0.0.1:3000/whoami HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X POST http://127.0.0.1:3000/whoami

```

`POST /whoami`

<h3 id="whoamicontroller_whoami_post-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## WhoamiController_whoami_put

<a id="opIdWhoamiController_whoami_put"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/whoami', {
  method: 'PUT'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
PUT http://127.0.0.1:3000/whoami HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X PUT http://127.0.0.1:3000/whoami

```

`PUT /whoami`

<h3 id="whoamicontroller_whoami_put-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## WhoamiController_whoami_delete

<a id="opIdWhoamiController_whoami_delete"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/whoami', {
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
DELETE http://127.0.0.1:3000/whoami HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X DELETE http://127.0.0.1:3000/whoami

```

`DELETE /whoami`

<h3 id="whoamicontroller_whoami_delete-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## WhoamiController_whoami_patch

<a id="opIdWhoamiController_whoami_patch"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/whoami', {
  method: 'PATCH'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
PATCH http://127.0.0.1:3000/whoami HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X PATCH http://127.0.0.1:3000/whoami

```

`PATCH /whoami`

<h3 id="whoamicontroller_whoami_patch-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## WhoamiController_whoami_options

<a id="opIdWhoamiController_whoami_options"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/whoami', {
  method: 'OPTIONS'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
OPTIONS http://127.0.0.1:3000/whoami HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X OPTIONS http://127.0.0.1:3000/whoami

```

`OPTIONS /whoami`

<h3 id="whoamicontroller_whoami_options-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## WhoamiController_whoami_head

<a id="opIdWhoamiController_whoami_head"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/whoami', {
  method: 'HEAD'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
HEAD http://127.0.0.1:3000/whoami HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X HEAD http://127.0.0.1:3000/whoami

```

`HEAD /whoami`

<h3 id="whoamicontroller_whoami_head-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## IpController_get

<a id="opIdIpController_get"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/ip', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/ip HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/ip

```

`GET /ip`

<h3 id="ipcontroller_get-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

<h1 id="api-fetchcache">FetchCache</h1>

## RequestController_get

<a id="opIdRequestController_get"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/fetch-cache/request/{requestId}', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/fetch-cache/request/{requestId} HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/fetch-cache/request/{requestId}

```

`GET /fetch-cache/request/{requestId}`

<h3 id="requestcontroller_get-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|requestId|path|string|true|none|

<h3 id="requestcontroller_get-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="info">
认证方式:
cookie, bearer
</aside>

<h1 id="api-actuator">Actuator</h1>

## Process status

<a id="opIdProcessController_process"></a>

> 代码示例

```javascript

const headers = {
  'Authorization':'Bearer {access-token}'
};

fetch('http://127.0.0.1:3000/actuator/process', {
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/actuator/process HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/actuator/process \
  -H 'Authorization: Bearer {access-token}'

```

`GET /actuator/process`

<h3 id="process-status-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="info">
认证方式:
bearer
</aside>

## List Env

<a id="opIdEnvController_listEnv"></a>

> 代码示例

```javascript

const headers = {
  'Authorization':'Bearer {access-token}'
};

fetch('http://127.0.0.1:3000/actuator/env', {
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/actuator/env HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/actuator/env \
  -H 'Authorization: Bearer {access-token}'

```

`GET /actuator/env`

<h3 id="list-env-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="info">
认证方式:
bearer
</aside>

## Get Env

<a id="opIdEnvController_getEnv"></a>

> 代码示例

```javascript

const headers = {
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'
};

fetch('http://127.0.0.1:3000/actuator/env/{name}', {
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/actuator/env/{name} HTTP/1.1
Host: 127.0.0.1:3000
Accept: application/json

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/actuator/env/{name} \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`GET /actuator/env/{name}`

<h3 id="get-env-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|name|path|string|true|none|

> 响应示例

> 200 响应

```json
{}
```

<h3 id="get-env-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

<h3 id="get-env-responseschema">响应内容</h3>

<aside class="info">
认证方式:
bearer
</aside>

## Set Env

<a id="opIdEnvController_setEnv"></a>

> 代码示例

```javascript
const inputBody = '{
  "value": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json',
  'Authorization':'Bearer {access-token}'
};

fetch('http://127.0.0.1:3000/actuator/env/{name}', {
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
POST http://127.0.0.1:3000/actuator/env/{name} HTTP/1.1
Host: 127.0.0.1:3000
Content-Type: application/json
Accept: application/json

```

```shell
# 也可以用 wget
curl -X POST http://127.0.0.1:3000/actuator/env/{name} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer {access-token}'

```

`POST /actuator/env/{name}`

> Body parameter

```json
{
  "value": "string"
}
```

<h3 id="set-env-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|name|path|string|true|none|
|body|body|[SetEnvBody](#schemasetenvbody)|true|none|

> 响应示例

> 200 响应

```json
{
  "name": "string",
  "old": "string",
  "neo": "string"
}
```

<h3 id="set-env-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[SetEnvResult](#schemasetenvresult)|

<aside class="info">
认证方式:
bearer
</aside>

## HealthController_readiness

<a id="opIdHealthController_readiness"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/actuator/health/readiness', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/actuator/health/readiness HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/actuator/health/readiness

```

`GET /actuator/health/readiness`

<h3 id="healthcontroller_readiness-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## HealthController_liveness

<a id="opIdHealthController_liveness"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/actuator/health/liveness', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/actuator/health/liveness HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/actuator/health/liveness

```

`GET /actuator/health/liveness`

<h3 id="healthcontroller_liveness-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## HealthController_ping

<a id="opIdHealthController_ping"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/actuator/health', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/actuator/health HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/actuator/health

```

`GET /actuator/health`

<h3 id="healthcontroller_ping-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

<h1 id="api-github">GitHub</h1>

## RepoController_version

<a id="opIdRepoController_version"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/github/r/{owner}/{repo}/version', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/github/r/{owner}/{repo}/version HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/github/r/{owner}/{repo}/version

```

`GET /github/r/{owner}/{repo}/version`

<h3 id="repocontroller_version-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|owner|path|string|true|none|
|repo|path|string|true|none|
|prerelease|query|boolean|false|none|
|loose|query|boolean|false|none|
|range|query|string|false|none|
|calver|query|string|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|calver|only|
|calver|ignore|

<h3 id="repocontroller_version-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## RepoController_listTag

<a id="opIdRepoController_listTag"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/github/r/{owner}/{repo}/tag', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/github/r/{owner}/{repo}/tag HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/github/r/{owner}/{repo}/tag

```

`GET /github/r/{owner}/{repo}/tag`

<h3 id="repocontroller_listtag-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|owner|path|string|true|none|
|repo|path|string|true|none|
|prerelease|query|boolean|false|none|
|loose|query|boolean|false|none|
|range|query|string|false|none|
|calver|query|string|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|calver|only|
|calver|ignore|

<h3 id="repocontroller_listtag-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

<h1 id="api-alpine">Alpine</h1>

## PackageController_list

<a id="opIdPackageController_list"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/alpine/pkg', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/alpine/pkg HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/alpine/pkg

```

`GET /alpine/pkg`

<h3 id="packagecontroller_list-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## PackageController_getFlagged

<a id="opIdPackageController_getFlagged"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/alpine/pkg/-/flagged', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/alpine/pkg/-/flagged HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/alpine/pkg/-/flagged

```

`GET /alpine/pkg/-/flagged`

<h3 id="packagecontroller_getflagged-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## PackageController_getPkg

<a id="opIdPackageController_getPkg"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/alpine/pkg/{pkg}', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/alpine/pkg/{pkg} HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/alpine/pkg/{pkg}

```

`GET /alpine/pkg/{pkg}`

<h3 id="packagecontroller_getpkg-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## PackageController_getVersion

<a id="opIdPackageController_getVersion"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/alpine/pkg/{arch}/{repo}/{pkg}/{version}', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/alpine/pkg/{arch}/{repo}/{pkg}/{version} HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/alpine/pkg/{arch}/{repo}/{pkg}/{version}

```

`GET /alpine/pkg/{arch}/{repo}/{pkg}/{version}`

<h3 id="packagecontroller_getversion-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## MirrorController_list

<a id="opIdMirrorController_list"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/alpine/mirror', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/alpine/mirror HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/alpine/mirror

```

`GET /alpine/mirror`

<h3 id="mirrorcontroller_list-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## ContentController_getContent

<a id="opIdContentController_getContent"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/alpine/content/{arch}/{repo}/{pkg}/{version}/*', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/alpine/content/{arch}/{repo}/{pkg}/{version}/* HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/alpine/content/{arch}/{repo}/{pkg}/{version}/*

```

`GET /alpine/content/{arch}/{repo}/{pkg}/{version}/*`

<h3 id="contentcontroller_getcontent-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## AlpineController_version

<a id="opIdAlpineController_version"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/alpine/version', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/alpine/version HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/alpine/version

```

`GET /alpine/version`

<h3 id="alpinecontroller_version-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## AlpineController_versionTxt

<a id="opIdAlpineController_versionTxt"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/alpine/latest', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/alpine/latest HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/alpine/latest

```

`GET /alpine/latest`

<h3 id="alpinecontroller_versiontxt-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

<h1 id="api-qrcode">QrCode</h1>

## Encode data to QR code

<a id="opIdQrController_enc"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/qr/enc/{format}/{dataFormat}/*', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/qr/enc/{format}/{dataFormat}/* HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/qr/enc/{format}/{dataFormat}/*

```

`GET /qr/enc/{format}/{dataFormat}/*`

<h3 id="encode-data-to-qr-code-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|format|path|string|true|none|
|dataFormat|path|string|true|none|
|*|path|string|true|none|
|margin|path|any|false|none|
|scale|path|any|false|none|
|width|path|any|false|none|
|fg|path|any|false|none|
|bg|path|any|false|none|
|level|path|any|false|none|

#### Enumerated Values

|Parameter|Value|
|---|---|
|format|png|
|format|svg|
|format|jpg|
|dataFormat|base64|
|dataFormat|raw|

<h3 id="encode-data-to-qr-code-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

## QrController_dec

<a id="opIdQrController_dec"></a>

> 代码示例

```javascript
const inputBody = '{
  "file": "string"
}';
const headers = {
  'Content-Type':'multipart/form-data'
};

fetch('http://127.0.0.1:3000/qr/dec/{format}', {
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
POST http://127.0.0.1:3000/qr/dec/{format} HTTP/1.1
Host: 127.0.0.1:3000
Content-Type: multipart/form-data

```

```shell
# 也可以用 wget
curl -X POST http://127.0.0.1:3000/qr/dec/{format} \
  -H 'Content-Type: multipart/form-data'

```

`POST /qr/dec/{format}`

> Body parameter

```yaml
file: string

```

<h3 id="qrcontroller_dec-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|format|path|string|true|none|
|body|body|[FileUploadDto](#schemafileuploaddto)|true|QR code image file|

#### Enumerated Values

|Parameter|Value|
|---|---|
|format|json|
|format|text|

<h3 id="qrcontroller_dec-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|none|无|

<aside class="success">
不需要认证
</aside>

<h1 id="api-hackernews">HackerNews</h1>

## HnController_item

<a id="opIdHnController_item"></a>

> 代码示例

```javascript

fetch('http://127.0.0.1:3000/hn/item/{id}.json', {
  method: 'GET'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```http
GET http://127.0.0.1:3000/hn/item/{id}.json HTTP/1.1
Host: 127.0.0.1:3000

```

```shell
# 也可以用 wget
curl -X GET http://127.0.0.1:3000/hn/item/{id}.json

```

`GET /hn/item/{id}.json`

<h3 id="hncontroller_item-parameters">参数</h3>

|名字|位置|类型|必须|说明|
|---|---|---|---|---|
|id|path|number|true|none|

<h3 id="hncontroller_item-responses">响应</h3>

|状态|含义|描述|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|无|

<aside class="success">
不需要认证
</aside>

# Schemas

<h2 id="tocS_HashDigestRequest">HashDigestRequest</h2>

<a id="schemahashdigestrequest"></a>
<a id="schema_HashDigestRequest"></a>
<a id="tocShashdigestrequest"></a>
<a id="tocshashdigestrequest"></a>

```json
{
  "data": "string",
  "encoding": "raw"
}

```

### 属性

|名字|类型|必须|限制|描述|
|---|---|---|---|---|
|data|string|true|无|无|
|encoding|string|true|无|无|

#### 枚举值

|属性|值|
|---|---|
|encoding|raw|
|encoding|base64|

<h2 id="tocS_HashDigestResponse">HashDigestResponse</h2>

<a id="schemahashdigestresponse"></a>
<a id="schema_HashDigestResponse"></a>
<a id="tocShashdigestresponse"></a>
<a id="tocshashdigestresponse"></a>

```json
{
  "base64": "string",
  "sha1": "string",
  "sha256": "string",
  "sha384": "string",
  "sha512": "string"
}

```

### 属性

|名字|类型|必须|限制|描述|
|---|---|---|---|---|
|base64|string|true|无|无|
|sha1|string|true|无|无|
|sha256|string|true|无|无|
|sha384|string|true|无|无|
|sha512|string|true|无|无|

<h2 id="tocS_SetEnvBody">SetEnvBody</h2>

<a id="schemasetenvbody"></a>
<a id="schema_SetEnvBody"></a>
<a id="tocSsetenvbody"></a>
<a id="tocssetenvbody"></a>

```json
{
  "value": "string"
}

```

### 属性

|名字|类型|必须|限制|描述|
|---|---|---|---|---|
|value|string|true|无|无|

<h2 id="tocS_SetEnvResult">SetEnvResult</h2>

<a id="schemasetenvresult"></a>
<a id="schema_SetEnvResult"></a>
<a id="tocSsetenvresult"></a>
<a id="tocssetenvresult"></a>

```json
{
  "name": "string",
  "old": "string",
  "neo": "string"
}

```

### 属性

|名字|类型|必须|限制|描述|
|---|---|---|---|---|
|name|string|true|无|无|
|old|string|false|无|无|
|neo|string|false|无|无|

<h2 id="tocS_FileUploadDto">FileUploadDto</h2>

<a id="schemafileuploaddto"></a>
<a id="schema_FileUploadDto"></a>
<a id="tocSfileuploaddto"></a>
<a id="tocsfileuploaddto"></a>

```json
{
  "file": "string"
}

```

### 属性

|名字|类型|必须|限制|描述|
|---|---|---|---|---|
|file|string(binary)|true|无|无|

