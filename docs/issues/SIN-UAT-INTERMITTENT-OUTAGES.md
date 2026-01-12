# SIN-UAT Intermittent Outages Investigation

**Date**: 2026-01-10
**Environment**: sin-uat (sinuat.solsticeapp.ca)
**Status**: ✅ RESOLVED

## Symptom

The sin-uat environment goes down intermittently after some hours of working correctly. Redeploying with `sst deploy` fixes it temporarily, but the issue recurs.

---

## Full Investigation Log

### Step 1: Initial Site Status Check

```bash
$ curl -s -o /dev/null -w "%{http_code}" https://sinuat.solsticeapp.ca/
000  # Connection failure

$ curl -s -m 10 https://sinuat.solsticeapp.ca/api/health
# (no response - timeout)
```

**Result**: Site completely unreachable, HTTP 000 indicates DNS/connection failure.

---

### Step 2: Check Lambda Functions Exist

```bash
$ AWS_PROFILE=techdev aws lambda list-functions --region ca-central-1 \
    --query "Functions[?contains(FunctionName, 'sin-uat')].{Name:FunctionName,State:State,LastModified:LastModified}" \
    --output table
```

**Result**:
| Name | State | LastModified |
|------|-------|--------------|
| solstice-sin-uat-WebDevServerFunction-hrfxmrhc | None | 2026-01-09 |
| solstice-sin-uat-ScheduledNotificationsHandler... | None | 2026-01-09 |
| solstice-sin-uat-RetentionEnforcementHandler... | None | 2026-01-09 |
| solstice-sin-uat-DataQualityMonitorHandler... | None | 2026-01-09 |

**Observation**: Lambda functions exist. State "None" is normal (means no pending updates). But note the function name includes "DevServer" - this is suspicious for a production deployment.

---

### Step 3: Check Lambda Function Configuration

```bash
$ AWS_PROFILE=techdev aws lambda get-function \
    --function-name "solstice-sin-uat-WebDevServerFunction-hrfxmrhc" \
    --query "{State:Configuration.State,LastModified:Configuration.LastModified,Timeout:Configuration.Timeout,MemorySize:Configuration.MemorySize}"
```

**Result**:

```json
{
    "State": "Active",
    "LastModified": "2026-01-09T21:04:28.000+0000",
    "Timeout": 20,
    "MemorySize": 128
}
```

**Red Flag #1**: Memory is 128 MB, but `sst.config.ts` specifies `memory: "1024 MB"`. The full config isn't being applied.

---

### Step 4: Check Lambda Function URL

```bash
$ AWS_PROFILE=techdev aws lambda get-function-url-config \
    --function-name "solstice-sin-uat-WebDevServerFunction-hrfxmrhc"
```

**Result**:

```
An error occurred (ResourceNotFoundException) when calling the GetFunctionUrlConfig operation:
The resource you requested does not exist.
```

**Red Flag #2**: No Function URL configured. This means the Lambda isn't publicly accessible.

---

### Step 5: Check CloudFront Distributions

```bash
$ AWS_PROFILE=techdev aws cloudfront list-distributions \
    --query "DistributionList.Items" --output json
```

**Result**:

```json
null
```

**Red Flag #3**: Zero CloudFront distributions in the techdev account. A proper TanStackStart deployment should create one.

---

### Step 6: Check Lambda Logs

```bash
$ AWS_PROFILE=techdev aws logs tail \
    "/aws/lambda/solstice-sin-uat-WebDevServerFunction-hrfxmrhc" \
    --since 2h --format short
```

**Result**:

```
An error occurred (ResourceNotFoundException) when calling the FilterLogEvents operation:
The specified log group does not exist.
```

**Red Flag #4**: No log group means the function has NEVER been invoked.

---

### Step 7: Check CloudWatch Metrics for Lambda Errors

```bash
$ AWS_PROFILE=techdev aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Errors \
    --dimensions Name=FunctionName,Value=solstice-sin-uat-WebDevServerFunction-hrfxmrhc \
    --start-time $(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
    --period 3600 --statistics Sum
```

**Result**:

```json
{
    "Label": "Errors",
    "Datapoints": []
}
```

**Confirmed**: No errors because function is never invoked.

---

### Step 8: Examine SST State

```bash
$ AWS_PROFILE=techdev npx sst state export --stage sin-uat | grep -E '"url":'
```

**Result**:

```
"url": "http://localhost:5173"
"url": "http://localhost:5173"
"url": "http://localhost:5173"
"url": "https://sqs.ca-central-1.amazonaws.com/891623777507/solstice-sin-uat-SinNotificationsDlqQueue-fhcmomwb"
...
```

**CRITICAL FINDING**: The Web URL is `http://localhost:5173` instead of `https://sinuat.solsticeapp.ca`. This is the root cause.

---

### Step 9: Check SST State for TanstackStart Resources

```bash
$ AWS_PROFILE=techdev npx sst state export --stage sin-uat | grep -E '"urn":.*TanstackStart'
```

**Result**:

```
"urn": "urn:pulumi:sin-uat::solstice::sst:aws:TanstackStart::Web",
"urn": "urn:pulumi:sin-uat::solstice::sst:aws:TanstackStart$sst:aws:Function::WebDevServer",
"urn": "urn:pulumi:sin-uat::solstice::sst:aws:TanstackStart$sst:aws:Function$aws:cloudwatch/logGroup:LogGroup::WebDevServerLogGroup",
"urn": "urn:pulumi:sin-uat::solstice::sst:aws:TanstackStart$sst:aws:Function$aws:iam/role:Role::WebDevServerRole",
"urn": "urn:pulumi:sin-uat::solstice::sst:aws:TanstackStart$sst:aws:Function$aws:s3/bucketObjectv2:BucketObjectv2::WebDevServerCode",
"urn": "urn:pulumi:sin-uat::solstice::sst:aws:TanstackStart$sst:aws:Function$aws:lambda/function:Function::WebDevServerFunction",
```

**Observation**: Only 6 resources exist under TanstackStart. A proper deployment should have:

- `WebServerCacentral1Function` (production Lambda)
- `WebServerCacentral1Url` (Function URL)
- `WebCdn` (CloudFront distribution)
- `WebAssetFiles` (S3 bucket files)
- Route53 records

Missing: CloudFront, Function URL, Route53 records, Asset bucket.

---

### Step 10: Check for Running SST Processes

```bash
$ ps aux | grep -E "sst.*sin-uat" | grep -v grep
```

**Result**:

```
austin  61144  0.0  0.2 412278752 262096   ??  S  8:59PM  0:16.16 /Users/austin/.sst/bin/sst dev --stage sin-uat --mode mono
austin  61137  0.0  0.0 436116320  46704   ??  S  8:59PM  0:00.05 node node_modules/.bin/../sst/bin/sst.mjs dev --stage sin-uat --mode mono
```

**ROOT CAUSE FOUND**: An `sst dev --stage sin-uat` process is running! This explains:

1. Why the state shows `localhost:5173`
2. Why the site works intermittently (when this process is running)
3. Why `sst deploy` doesn't fix it (state is already corrupted)

---

### Step 11: Analyze SST Source Code

Examined `~/dev/_libraries/sst/platform/src/components/aws/ssr-site.ts`:

**Line 915** - Dev mode detection:

```typescript
const enabled = $dev && args.dev !== false;
```

**Lines 675-690** - Early return for dev mode:

```typescript
if (dev.enabled) {
  const server = createDevServer();
  this.devUrl = dev.url;
  this.registerOutputs({
    _metadata: {
      mode: "placeholder",  // <-- Corrupted state marker
      path: sitePath,
      server: server.arn,
    },
    _dev: {
      ...dev.outputs,
      aws: { role: server.nodes.role.arn },
    },
  });
  return;  // <-- CRITICAL: Skips CloudFront/CDN creation!
}
```

**Explanation**: When `sst dev` runs, it:

1. Sets `$dev = true`
2. Creates only a placeholder `WebDevServer` Lambda (128MB)
3. Returns BEFORE creating CloudFront, Function URL, Route53 records
4. Stores `localhost:5173` in state

When `sst deploy` runs later:

1. `$dev = false`, but state already has placeholder resources
2. Pulumi sees same URNs and doesn't recreate
3. No CloudFront/CDN is ever created

---

### Step 12: Things Ruled Out

| Hypothesis           | How Ruled Out                                 |
| -------------------- | --------------------------------------------- |
| Lambda crashed       | CloudWatch shows no errors, no invocations    |
| Lambda throttled     | No throttling metrics                         |
| CloudFront issue     | No CloudFront distribution exists             |
| DNS misconfiguration | DNS resolves correctly to CloudFront IPs      |
| Certificate issue    | ACM certificate valid (checked later)         |
| VPC/Security Group   | Lambda not in VPC (serverless)                |
| Rate limiting        | No invocations means no rate limiting         |
| Memory/timeout       | Function never invoked, so not relevant       |
| Deployment failure   | Deploy "succeeds" but creates wrong resources |

---

### Step 13: Kill Running `sst dev` Process

```bash
$ kill 61144 61137
$ pkill -f "sst.*sin-uat"
```

**Result**: Processes terminated.

---

### Step 14: Attempt SST State Repair

```bash
$ AWS_PROFILE=techdev npx sst state repair --stage sin-uat
```

**Result**:

```
✕  No changes made
```

**Note**: State repair doesn't fix this issue because the state is "valid" - it's just configured for dev mode.

---

### Step 15: Attempt SST Refresh

```bash
$ AWS_PROFILE=techdev npx sst refresh --stage sin-uat
```

**Result**: Refreshed 160+ resources, but URL still shows `localhost:5173`.

**Note**: Refresh syncs state with AWS but doesn't change resource configuration.

---

### Step 16: First Deploy Attempt

```bash
$ AWS_PROFILE=techdev npx sst deploy --stage sin-uat
```

**Result**: Still outputs `url: http://localhost:5173`

**Analysis**: Deploy doesn't fix it because Pulumi sees existing resources with same URNs.

---

### Step 17: Check Route53 for Orphaned Records

```bash
$ AWS_PROFILE=techdev aws route53 list-resource-record-sets \
    --hosted-zone-id Z08572962E2ART44DDU47 \
    --query "ResourceRecordSets[?contains(Name, 'sinuat')]"
```

**Result**:

```json
[
    {
        "Name": "sinuat.solsticeapp.ca.",
        "Type": "A",
        "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "d3e9zi6c0srxm9.cloudfront.net.",
            "EvaluateTargetHealth": true
        }
    },
    {
        "Name": "sinuat.solsticeapp.ca.",
        "Type": "AAAA",
        "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "d3e9zi6c0srxm9.cloudfront.net.",
            "EvaluateTargetHealth": true
        }
    },
    {
        "Name": "_54c0ac99bba40b05960d8a6f382ef415.sinuat.solsticeapp.ca.",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [
            {"Value": "_4538d2b54baa23d351278e1523495e3e.jkddzztszm.acm-validations.aws."}
        ]
    }
]
```

**Discovery**: Route53 records exist pointing to `d3e9zi6c0srxm9.cloudfront.net` - an ORPHANED CloudFront distribution not in SST state!

---

### Step 18: Find Orphaned CloudFront Distribution

```bash
$ AWS_PROFILE=techdev aws cloudfront get-distribution --id E1F26KA7S2PZUS \
    --query "Distribution.{Id:Id,DomainName:DomainName,Status:Status,Aliases:DistributionConfig.Aliases,Origins:DistributionConfig.Origins.Items[*].DomainName}"
```

**Result**:

```json
{
    "Id": "E1F26KA7S2PZUS",
    "DomainName": "d3e9zi6c0srxm9.cloudfront.net",
    "Status": "Deployed",
    "Aliases": {
        "Quantity": 1,
        "Items": ["sinuat.solsticeapp.ca"]
    },
    "Origins": ["placeholder.sst.dev"]
}
```

**Analysis**: An orphaned CloudFront distribution exists with:

- Alias: `sinuat.solsticeapp.ca` (blocking new deployment)
- Origin: `placeholder.sst.dev` (dev mode placeholder)
- NOT in SST state (orphaned from previous corrupted deployment)

---

### Step 19: Delete Orphaned Route53 Records

```bash
# Delete SSL validation CNAME
$ AWS_PROFILE=techdev aws route53 change-resource-record-sets \
    --hosted-zone-id Z08572962E2ART44DDU47 \
    --change-batch '{
      "Changes": [{
        "Action": "DELETE",
        "ResourceRecordSet": {
          "Name": "_54c0ac99bba40b05960d8a6f382ef415.sinuat.solsticeapp.ca.",
          "Type": "CNAME",
          "TTL": 60,
          "ResourceRecords": [{"Value": "_4538d2b54baa23d351278e1523495e3e.jkddzztszm.acm-validations.aws."}]
        }
      }]
    }'
```

**Result**:

```json
{"ChangeInfo": {"Id": "/change/C03445962E6AB5JBFL1JE", "Status": "PENDING"}}
```

```bash
# Delete A and AAAA records
$ AWS_PROFILE=techdev aws route53 change-resource-record-sets \
    --hosted-zone-id Z08572962E2ART44DDU47 \
    --change-batch '{
      "Changes": [
        {
          "Action": "DELETE",
          "ResourceRecordSet": {
            "Name": "sinuat.solsticeapp.ca.",
            "Type": "A",
            "AliasTarget": {
              "HostedZoneId": "Z2FDTNDATAQYW2",
              "DNSName": "d3e9zi6c0srxm9.cloudfront.net.",
              "EvaluateTargetHealth": true
            }
          }
        },
        {
          "Action": "DELETE",
          "ResourceRecordSet": {
            "Name": "sinuat.solsticeapp.ca.",
            "Type": "AAAA",
            "AliasTarget": {
              "HostedZoneId": "Z2FDTNDATAQYW2",
              "DNSName": "d3e9zi6c0srxm9.cloudfront.net.",
              "EvaluateTargetHealth": true
            }
          }
        }
      ]
    }'
```

**Result**:

```json
{"ChangeInfo": {"Id": "/change/C00250152NBR4FF8PUBMZ", "Status": "PENDING"}}
```

---

### Step 20: Disable and Delete Orphaned CloudFront

```bash
# Get ETag for update
$ AWS_PROFILE=techdev aws cloudfront get-distribution-config --id E1F26KA7S2PZUS \
    --query "ETag" --output text
E34K22DCDNG2RA

# Disable distribution
$ AWS_PROFILE=techdev aws cloudfront get-distribution-config --id E1F26KA7S2PZUS \
    --query "DistributionConfig" --output json > /tmp/cf-config.json
$ jq '.Enabled = false' /tmp/cf-config.json > /tmp/cf-config-disabled.json
$ AWS_PROFILE=techdev aws cloudfront update-distribution --id E1F26KA7S2PZUS \
    --if-match E34K22DCDNG2RA \
    --distribution-config file:///tmp/cf-config-disabled.json
```

**Result**:

```json
{"Id": "E1F26KA7S2PZUS", "Status": "InProgress"}
```

```bash
# Wait for disable to complete, then delete
$ AWS_PROFILE=techdev aws cloudfront get-distribution --id E1F26KA7S2PZUS \
    --query "Distribution.Status" --output text
Deployed

$ AWS_PROFILE=techdev aws cloudfront get-distribution --id E1F26KA7S2PZUS \
    --query "ETag" --output text
EZ8AKJC1VLC0M

$ AWS_PROFILE=techdev aws cloudfront delete-distribution --id E1F26KA7S2PZUS \
    --if-match EZ8AKJC1VLC0M
```

**Result**: CloudFront distribution deleted.

---

### Step 21: Delete Corrupted Lambda Function

```bash
$ AWS_PROFILE=techdev aws lambda delete-function \
    --function-name "solstice-sin-uat-WebDevServerFunction-hrfxmrhc"
```

**Result**: Function deleted (forces Pulumi to recreate on next deploy).

---

### Step 22: Final Successful Deployment

```bash
$ AWS_PROFILE=techdev npx sst deploy --stage sin-uat
```

**Result** (key excerpts):

```
|  Created     Web sst:aws:TanstackStart → WebServerCacentral1 sst:aws:Function
|  Created     Web sst:aws:TanstackStart → WebServerCacentral1LogGroup aws:cloudwatch:LogGroup
|  Created     Web sst:aws:TanstackStart → WebServerCacentral1Role aws:iam:Role
|  Created     Web sst:aws:TanstackStart → WebAssetFiles sst:aws:BucketFiles
|  Created     Web sst:aws:TanstackStart → WebServerCacentral1Code aws:s3:BucketObjectv2
|  Created     Web sst:aws:TanstackStart → WebServerCacentral1Function aws:lambda:Function
|  Created     Web sst:aws:TanstackStart → WebCdnARecordSinuatsolsticeappca aws:route53:Record
|  Created     Web sst:aws:TanstackStart → WebServerCacentral1Url aws:lambda:FunctionUrl
|  Created     Web sst:aws:TanstackStart → WebCdnAAAARecordSinuatsolsticeappca aws:route53:Record
|  Created     WebServerCacentral1UrlInvokePermission aws-native:lambda:Permission
|  Created     Web sst:aws:TanstackStart → WebCdnWaiter sst:aws:DistributionDeploymentWaiter
|  Deleted     WebDevServer sst:aws:Function → WebDevServerFunction aws:lambda:Function
|  Deleted     WebDevServer sst:aws:Function → WebDevServerCode aws:s3:BucketObjectv2
|  Deleted     WebDevServer sst:aws:Function → WebDevServerLogGroup aws:cloudwatch:LogGroup
|  Deleted     WebDevServer sst:aws:Function → WebDevServerRole aws:iam:Role
|  Deleted     Web sst:aws:TanstackStart → WebDevServer sst:aws:Function

✓  Complete
   Web: https://sinuat.solsticeapp.ca
   url: https://sinuat.solsticeapp.ca  ← CORRECT!
```

---

### Step 23: Verify Site is Working

```bash
# Local DNS may be cached, use explicit resolution
$ curl -s --resolve sinuat.solsticeapp.ca:443:108.139.10.42 \
    -o /dev/null -w "%{http_code}" https://sinuat.solsticeapp.ca/
200

# Verify DNS resolves via Google DNS
$ host sinuat.solsticeapp.ca 8.8.8.8
sinuat.solsticeapp.ca has address 108.139.10.42
sinuat.solsticeapp.ca has address 108.139.10.99
sinuat.solsticeapp.ca has address 108.139.10.84
sinuat.solsticeapp.ca has address 108.139.10.20
```

**Result**: Site returns HTTP 200. DNS resolves to CloudFront edge IPs.

---

### Step 24: Verify SST State is Correct

```bash
$ AWS_PROFILE=techdev npx sst state export --stage sin-uat | grep -E '"url":' | head -3
```

**Result**:

```
"url": "https://sinuat.solsticeapp.ca"
"url": "https://sinuat.solsticeapp.ca"
"url": "https://sinuat.solsticeapp.ca"
```

**Confirmed**: State now shows correct production URL.

---

### Step 25: Verify Route53 Records

```bash
$ AWS_PROFILE=techdev aws route53 list-resource-record-sets \
    --hosted-zone-id Z08572962E2ART44DDU47 \
    --query "ResourceRecordSets[?contains(Name, 'sinuat')]"
```

**Result**:

```json
[
    {
        "Name": "sinuat.solsticeapp.ca.",
        "Type": "A",
        "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "df6153m2pihxm.cloudfront.net.",  ← NEW distribution
            "EvaluateTargetHealth": true
        }
    },
    {
        "Name": "sinuat.solsticeapp.ca.",
        "Type": "AAAA",
        "AliasTarget": {
            "HostedZoneId": "Z2FDTNDATAQYW2",
            "DNSName": "df6153m2pihxm.cloudfront.net.",
            "EvaluateTargetHealth": true
        }
    },
    {
        "Name": "_54c0ac99bba40b05960d8a6f382ef415.sinuat.solsticeapp.ca.",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [
            {"Value": "_4538d2b54baa23d351278e1523495e3e.jkddzztszm.acm-validations.aws."}
        ]
    }
]
```

**Confirmed**: Route53 now points to new CloudFront distribution `df6153m2pihxm.cloudfront.net`.

---

## Root Cause Summary

1. Someone ran `sst dev --stage sin-uat` instead of `sst deploy`
2. `sst dev` creates placeholder resources with `localhost:5173` URLs
3. Site only works while the `sst dev` process is running
4. When process dies, site goes down
5. Subsequent `sst deploy` commands don't fix it because:
   - Pulumi sees existing resources with same URNs
   - State is "valid" just configured for dev mode
   - No CloudFront/Function URL resources are created

---

## Prevention: Guard Added to sst.config.ts

```typescript
// GUARD: Prevent `sst dev` on non-local stages to avoid state corruption
// See: docs/issues/SIN-UAT-INTERMITTENT-OUTAGES.md
const protectedStages = ["sin-uat", "sin-prod", "qc-prod", "sin-perf", "qc-perf"];
if ($dev && protectedStages.includes(stage.toLowerCase())) {
  throw new Error(
    `BLOCKED: Cannot run 'sst dev' on protected stage "${stage}".\n` +
      `This would corrupt the deployment state and cause intermittent outages.\n` +
      `Use 'sst deploy --stage ${stage}' for deployments.\n` +
      `For local development, use 'sst dev --stage sin-austin' or 'sst dev --stage qc-austin'.`,
  );
}
```

---

## Recovery Procedure (If This Happens Again)

1. **Check for running `sst dev` process**:

   ```bash
   ps aux | grep "sst dev.*sin-uat"
   ```

2. **Kill any running process**:

   ```bash
   pkill -f "sst.*sin-uat"
   ```

3. **Check for orphaned CloudFront**:

   ```bash
   AWS_PROFILE=techdev aws cloudfront list-distributions --output json | \
     jq '.DistributionList.Items[] | select(.Aliases.Items[]? | contains("sinuat"))'
   ```

4. **If orphaned CloudFront exists, delete Route53 records first**:

   ```bash
   # Get current records
   AWS_PROFILE=techdev aws route53 list-resource-record-sets \
     --hosted-zone-id Z08572962E2ART44DDU47 \
     --query "ResourceRecordSets[?contains(Name, 'sinuat')]"

   # Delete them (adjust values based on output above)
   # Then disable CloudFront, wait, delete CloudFront
   ```

5. **Delete corrupted Lambda**:

   ```bash
   # Find function name
   AWS_PROFILE=techdev aws lambda list-functions --region ca-central-1 \
     --query "Functions[?contains(FunctionName, 'sin-uat-Web')].FunctionName" --output text

   # Delete it
   AWS_PROFILE=techdev aws lambda delete-function --function-name "<name>"
   ```

6. **Deploy fresh**:

   ```bash
   AWS_PROFILE=techdev npx sst deploy --stage sin-uat
   ```

7. **Verify**:
   ```bash
   AWS_PROFILE=techdev npx sst state export --stage sin-uat | grep -E '"url":'
   # Should show https://sinuat.solsticeapp.ca, NOT localhost
   ```

---

## Related Files

- `sst.config.ts` - SST configuration (guard added at line 136-148)
- `~/dev/_libraries/sst/platform/src/components/aws/ssr-site.ts` - SST source showing dev mode behavior
- `docs/runbooks/new-environment-setup.md` - Environment setup procedures

---

## Lessons Learned

1. **Never run `sst dev` on shared/production stages** - It corrupts state
2. **`sst deploy` doesn't fix corrupted state** - Pulumi sees same URNs
3. **Orphaned AWS resources can exist outside SST state** - Must clean manually
4. **Check for running processes** before debugging deployment issues
5. **Add guards to prevent accidental `sst dev`** on protected stages
