sst issues
UAT

1:

ausjndsfakjdnfakjdsfnak
/
solstice
/
sin-uat

Jump to
⌘
K
Logout

Resources

Updates

Issues

Logs
LambdaTimeoutError
rincipalId":"AROA47GHLETR7ZAEESOMR:sst","arn":"arn:aws:sts::891623777507:assumed-role/sst-em72a48731g8undliq7agwu3/sst","accountId":"891623777507","accessKeyId":"ASIA47GHLETRUMMAHFMC","sessionContext":{"sessionIssuer":{"type":"Role","principalId":"AROA47GHLETR7ZAEESOMR","arn":"arn:aws:iam::891623777507:role/sst-em72a48731g8undliq7agwu3","accountId":"891623777507","userName":"sst-em72a48731g8undliq7agwu3"},"attributes":{"creationDate":"2026-01-09T00:45:32Z","mfaAuthenticated":"false"}}},"eventTime":"2026-01-09T00:45:32Z","eventSource":"logs.amazonaws.com","eventName":"PutSubscriptionFilter","awsRegion":"ca-central-1","sourceIPAddress":"13.216.64.19","userAgent":"aws-sdk-js/3.699.0 ua/2.1 os/linux#5.10.245-271.979.amzn2.x86_64 lang/js md/nodejs#22.18.0 api/cloudwatch-logs#3.699.0 exec-env/AWS_Lambda_nodejs22.x m/D,e","requestParameters":{"logGroupName":"/aws/lambda/solstice-sin-dev-RetentionEnforcementHandlerFunction-dtxhvavs","filterName":"sst#ca-central-1#891623777507#solstice#sin-dev","filterPattern":"?\"Invoke Error\" ?\"Error: Runtime exited\" ?\"Task timed out after\" ?\"ERROR\t\" ?\"[ERROR]\"","destinationArn":"arn:aws:lambda:ca-central-1:891623777507:function:sst-console-issue-em72a48731g8undliq7agwu3","applyOnTransformedLogs":false},"responseElements":null,"requestID":"dda62f2c-29fe-4432-a4bf-2aecdf68b698","eventID":"a415d49c-b11f-444e-8824-720236b0a94c","readOnly":false,"resources":[{"accountId":"891623777507","type":"AWS::Logs::LogGroup","ARN":"arn:aws:logs:ca-central-1:891623777507:log-group:/aws/lambda/solstice-sin-dev-RetentionEnforcementHandlerFunction-dtxhvavs"}],"eventType":"AwsApiCall","apiVersion":"20140328","managementEvent":true,"recipientAccountId":"891623777507","eventCategory":"Management","tlsDetails":{"tlsVersion":"TLSv1.3","cipherSuite":"TLS_AES_128_GCM_SHA256","clientProvidedHostHeader":"logs.ca-central-1.amazonaws.com"}}
Stack Trace
No stack trace available
Logs — Jan 8, 2026
{"eventVersion":"1.11","userIdentity":{"type":"AssumedRole","principalId":"AROA47GHLETRRTNJEBTCS:i-08c93cd0f3e081958","arn":"arn:aws:sts::891623777507:assumed-role/solstice-sin-uat-VpcNatInstanceRole-vathtrku/i-08c93cd0f3e081958","accountId":"891623777507","accessKeyId":"ASIA47GHLETRYMK75WY4","sessionContext":{"sessionIssuer":{"type":"Role","principalId":"AROA47GHLETRRTNJEBTCS","arn":"arn:aws:iam::891623777507:role/solstice-sin-uat-VpcNatInstanceRole-vathtrku","accountId":"891623777507","userName":"solstice-sin-uat-VpcNatInstanceRole-vathtrku"},"attributes":{"creationDate":"2026-01-08T20:13:34Z","mfaAuthenticated":"false"},"ec2RoleDelivery":"2.0"}},"eventTime":"2026-01-09T00:15:04Z","eventSource":"ssm.amazonaws.com","eventName":"UpdateInstanceInformation","awsRegion":"ca-central-1","sourceIPAddress":"3.96.36.9","userAgent":"aws-sdk-go/1.44.260 (go1.20.8; linux; arm64) amazon-ssm-agent/","requestParameters":{"instanceId":"i-08c93cd0f3e081958","agentVersion":"3.2.1705.0","agentStatus":"Active","platformType":"Linux","platformName":"Amazon Linux","platformVersion":"2023","iPAddress":"HIDDEN_DUE_TO_SECURITY_REASONS","computerName":"ip-10-0-2-206.ca-central-1.compute.internal","agentName":"amazon-ssm-agent","availabilityZone":"ca-central-1a","availabilityZoneId":"cac1-az1","sSMConnectionChannel":"ssmmessages"},"responseElements":null,"requestID":"5bfc5f5e-e9e5-4d01-8c16-0251fe3607b8","eventID":"b8f951c2-914a-4462-9668-0bf004b93062","readOnly":false,"eventType":"AwsApiCall","managementEvent":true,"recipientAccountId":"891623777507","eventCategory":"Management","tlsDetails":{"tlsVersion":"TLSv1.2","cipherSuite":"ECDHE-RSA-AES128-GCM-SHA256","clientProvidedHostHeader":"ssm.ca-central-1.amazonaws.com"}}
{"eventVersion":"1.11","userIdentity":{"type":"AssumedRole","principalId":"AROA47GHLETRRTNJEBTCS:i-0a54d2cacadb186c3","arn":"arn:aws:sts::891623777507:assumed-role/solstice-sin-uat-VpcNatInstanceRole-vathtrku/i-0a54d2cacadb186c3","accountId":"891623777507","accessKeyId":"ASIA47GHLETRSYMARSQJ","sessionContext":{"sessionIssuer":{"type":"Role","principalId":"AROA47GHLETRRTNJEBTCS","arn":"arn:aws:iam::891623777507:role/solstice-sin-uat-VpcNatInstanceRole-vathtrku","accountId":"891623777507","userName":"solstice-sin-uat-VpcNatInstanceRole-vathtrku"},"attributes":{"creationDate":"2026-01-08T20:13:35Z","mfaAuthenticated":"false"},"ec2RoleDelivery":"2.0"}},"eventTime":"2026-01-09T00:15:27Z","eventSource":"ssm.amazonaws.com","eventName":"UpdateInstanceInformation","awsRegion":"ca-central-1","sourceIPAddress":"15.157.75.120","userAgent":"aws-sdk-go/1.44.260 (go1.20.8; linux; arm64) amazon-ssm-agent/","requestParameters":{"instanceId":"i-0a54d2cacadb186c3","agentVersion":"3.2.1705.0","agentStatus":"Active","platformType":"Linux","platformName":"Amazon Linux","platformVersion":"2023","iPAddress":"HIDDEN_DUE_TO_SECURITY_REASONS","computerName":"ip-10-0-8-151.ca-central-1.compute.internal","agentName":"amazon-ssm-agent","availabilityZone":"ca-central-1b","availabilityZoneId":"cac1-az2","sSMConnectionChannel":"ssmmessages"},"responseElements":null,"requestID":"14b3581b-bc9d-4173-90da-a3caed2372c6","eventID":"53bdd3e5-17f9-40bf-b59c-4e9cc1d931d9","readOnly":false,"eventType":"AwsApiCall","managementEvent":true,"recipientAccountId":"891623777507","eventCategory":"Management","tlsDetails":{"tlsVersion":"TLSv1.2","cipherSuite":"ECDHE-RSA-AES128-GCM-SHA256","clientProvidedHostHeader":"ssm.ca-central-1.amazonaws.com"}}
{"eventVersion":"1.11","userIdentity":{"type":"AssumedRole","principalId":"AROA47GHLETR3ZVTZVIR3:i-061242faa7dc8a8c9","arn":"arn:aws:sts::891623777507:assumed-role/solstice-sin-dev-VpcNatInstanceRole-mwmhonnb/i-061242faa7dc8a8c9","accountId":"891623777507","accessKeyId":"ASIA47GHLETRQAUIXYL7","sessionContext":{"sessionIssuer":{"type":"Role","principalId":"AROA47GHLETR3ZVTZVIR3","arn":"arn:aws:iam::891623777507:role/solstice-sin-dev-VpcNatInstanceRole-mwmhonnb","accountId":"891623777507","userName":"solstice-sin-dev-VpcNatInstanceRole-mwmhonnb"},"attributes":{"creationDate":"2026-01-08T23:59:45Z","mfaAuthenticated":"false"},"ec2RoleDelivery":"2.0"}},"eventTime":"2026-01-09T00:28:35Z","eventSource":"ssm.amazonaws.com","eventName":"UpdateInstanceInformation","awsRegion":"ca-central-1","sourceIPAddress":"15.157.156.109","userAgent":"aws-sdk-go/1.44.260 (go1.20.8; linux; arm64) amazon-ssm-agent/","requestParameters":{"instanceId":"i-061242faa7dc8a8c9","agentVersion":"3.2.1705.0","agentStatus":"Active","platformType":"Linux","platformName":"Amazon Linux","platformVersion":"2023","iPAddress":"HIDDEN_DUE_TO_SECURITY_REASONS","computerName":"ip-10-0-10-1.ca-central-1.compute.internal","agentName":"amazon-ssm-agent","availabilityZone":"ca-central-1b","availabilityZoneId":"cac1-az2","sSMConnectionChannel":"ssmmessages"},"responseElements":null,"requestID":"5a06fd13-b96a-4b61-95b1-aa88a21b9ba0","eventID":"a2923ffd-44b8-4775-8e4d-6e33af0f0c2e","readOnly":false,"eventType":"AwsApiCall","managementEvent":true,"recipientAccountId":"891623777507","eventCategory":"Management","tlsDetails":{"tlsVersion":"TLSv1.2","cipherSuite":"ECDHE-RSA-AES128-GCM-SHA256","clientProvidedHostHeader":"ssm.ca-central-1.amazonaws.com"}}

2:

Auth]
Error Error: hex string expected, got non-hex character "JB" at index 0
Stack Trace
hexToBytes (file:///var/task/chunks/_/server.mjs:11789:13)
symmetricDecrypt (file:///var/task/chunks/_/server.mjs:12518:23)
async file:///var/task/chunks/_/server.mjs:40823:30
async internalHandler (file:///var/task/chunks/_/server.mjs:13070:22)
async file:///var/task/chunks/_/server.mjs:37968:26
async processRequest (file:///var/task/chunks/_/server.mjs:13401:14)
async handler (file:///var/task/chunks/_/server.mjs:13423:19)
async POST (file:///var/task/chunks/_/router-CbcGLGQa.mjs:3864:16)
async file:///var/task/chunks/_/server.mjs:5948:22
async next (file:///var/task/chunks/_/server.mjs:5963:16)
Logs

3

SERVER*ERROR
Error: hex string expected, got non-hex character "JB" at index 0
Stack Trace
hexToBytes (file:///var/task/chunks/*/server.mjs:11789:13)
symmetricDecrypt (file:///var/task/chunks/_/server.mjs:12518:23)
async file:///var/task/chunks/_/server.mjs:40823:30
async internalHandler (file:///var/task/chunks/_/server.mjs:13070:22)
async file:///var/task/chunks/_/server.mjs:37968:26
async processRequest (file:///var/task/chunks/_/server.mjs:13401:14)
async handler (file:///var/task/chunks/_/server.mjs:13423:19)
async POST (file:///var/task/chunks/_/router-CbcGLGQa.mjs:3864:16)
async file:///var/task/chunks/_/server.mjs:5948:22
async next (file:///var/task/chunks/\_/server.mjs:5963:16)
Logs

---

DEV

1:

DrizzleQueryError
Failed query: select count(\*) from "passkey" where "passkey"."user*id" = $1 params: sin-user-viasport-staff-001
Stack Trace
PostgresJsPreparedQuery.queryWithCache (file:///var/task/node_modules/drizzle-orm/pg-core/session.js:41:15)
process.processTicksAndRejections (node:internal/process/task_queues:95:5)
async file:///var/task/node_modules/drizzle-orm/postgres-js/session.js:37:20
async Object.serverFn (file:///var/task/chunks/*/auth.queries-C5O7g503.mjs:194:20)
async server (file:///var/task/chunks/_/server.mjs:2416:24)
async file:///var/task/chunks/_/server.mjs:5518:18
async file:///var/task/chunks/_/server.mjs:5481:20
async handleServerAction (file:///var/task/chunks/_/server.mjs:5479:20)
async file:///var/task/chunks/_/server.mjs:5773:26
async file:///var/task/chunks/_/server.mjs:5763:29
Logs

2:

[Error]
Seroval Error (step: 3)
Stack Trace
nr (file:///var/task/chunks/_/server.mjs:1299:11)
du (file:///var/task/chunks/_/server.mjs:2047:10) ... 4 lines matching cause stack trace ...
async file:///var/task/chunks/_/server.mjs:5743:26
async file:///var/task/chunks/_/server.mjs:5733:29
async file:///var/task/chunks/_/server.mjs:5948:22
async next (file:///var/task/chunks/_/server.mjs:5963:16)
Logs

3:

TypedServerError
Unauthorized
Stack Trace
createError (file:///var/task/chunks/_/errors-C9b8ZlyA.mjs:23:49)
unauthorized (file:///var/task/chunks/_/errors-C9b8ZlyA.mjs:24:61)
file:///var/task/chunks/_/auth-vv42Wzmt.mjs:34:13
async file:///var/task/chunks/_/server.mjs:5488:18
async file:///var/task/chunks/_/server.mjs:5451:20
async handleServerAction (file:///var/task/chunks/_/server.mjs:5449:20)
async file:///var/task/chunks/_/server.mjs:5743:26
async file:///var/task/chunks/_/server.mjs:5733:29
async file:///var/task/chunks/_/server.mjs:5948:22
async next (file:///var/task/chunks/_/server.mjs:5963:16)
Logs
