# Encryption Evidence (sin-dev)

Date: 2025-12-31
Updated: 2025-12-31

## RDS Encryption at Rest + Backup Retention

Command:

```
AWS_PROFILE=techdev aws rds describe-db-instances --region ca-central-1 \
  --query "DBInstances[?contains(DBInstanceIdentifier, 'solstice-sin-dev')].[DBInstanceIdentifier,StorageEncrypted,KmsKeyId,BackupRetentionPeriod,MultiAZ]" \
  --output table
```

Output:

```
--------------------------------------------------------------------------------------------------------------------------------------------------------
|                                                                  DescribeDBInstances                                                                 |
+---------------------------------------------+-------+----------------------------------------------------------------------------------+----+--------+
|  solstice-sin-dev-databaseinstance-bdckvktk |  True |  arn:aws:kms:ca-central-1:891623777507:key/3d7b0d8e-ddc8-4bfc-94ac-8de7661e4800  |  7 |  False |
|  solstice-sin-dev-dr-20251230               |  True |  arn:aws:kms:ca-central-1:891623777507:key/3d7b0d8e-ddc8-4bfc-94ac-8de7661e4800  |  7 |  False |
+---------------------------------------------+-------+----------------------------------------------------------------------------------+----+--------+
```

## RDS TLS Enforcement Check

Command:

```
AWS_PROFILE=techdev aws rds describe-db-parameters --region ca-central-1 \
  --db-parameter-group-name solstice-sin-dev-databaseparametergroup-vundetdd \
  --query "Parameters[?ParameterName=='rds.force_ssl'].[ParameterName,ParameterValue]" \
  --output table
```

Output (2025-12-31 post-update):

```
------------------------
| DescribeDBParameters |
+-----------------+----+
|  rds.force_ssl  |  1 |
+-----------------+----+
```

**Status**: TLS enforcement is now **ENABLED** (`rds.force_ssl=1`).

Note: The SST config had `forceSsl: true` but the existing parameter group wasn't
updated automatically. Manual CLI update applied 2025-12-31.

## S3 Artifacts Bucket

Bucket recreated: `solstice-sin-dev-sinartifactsbucket-smhmnosc` (2025-12-31)

### Encryption

Command:

```
AWS_PROFILE=techdev aws s3api get-bucket-encryption \
  --bucket solstice-sin-dev-sinartifactsbucket-smhmnosc \
  --region ca-central-1
```

Output:

```
{
    "ServerSideEncryptionConfiguration": {
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                },
                "BucketKeyEnabled": false
            }
        ]
    }
}
```

### Lifecycle Rules

Command:

```
AWS_PROFILE=techdev aws s3api get-bucket-lifecycle-configuration \
  --bucket solstice-sin-dev-sinartifactsbucket-smhmnosc \
  --region ca-central-1
```

Output:

```json
{
    "TransitionDefaultMinimumObjectSize": "all_storage_classes_128K",
    "Rules": [
        {
            "ID": "ArchiveToGlacier",
            "Status": "Enabled",
            "Filter": {
                "Prefix": ""
            },
            "Transitions": [{ "Days": 90, "StorageClass": "GLACIER" }]
        },
        {
            "ID": "DeleteOldVersions",
            "Status": "Enabled",
            "Filter": {
                "Prefix": ""
            },
            "NoncurrentVersionExpiration": { "NoncurrentDays": 180 }
        }
    ]
}
```

### Object Lock

Command:

```
AWS_PROFILE=techdev aws s3api get-object-lock-configuration \
  --bucket solstice-sin-dev-sinartifactsbucket-smhmnosc \
  --region ca-central-1
```

Output:

```
{
    "ObjectLockConfiguration": {
        "ObjectLockEnabled": "Enabled"
    }
}
```

**Status**: Enabled.
