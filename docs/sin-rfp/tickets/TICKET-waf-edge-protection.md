# TICKET: Add AWS WAF for Edge-Level Threat Protection

**Status**: Open
**Priority**: P2 (Enhancement)
**Component**: Infrastructure / Security
**Date**: 2026-01-07
**Author**: Claude (AI Assistant)

---

## Summary

Add AWS WAF (Web Application Firewall) to the CloudFront distribution for
edge-level threat filtering. This provides defense-in-depth by blocking
malicious requests before they reach the application.

---

## Background

Current security controls include:

- CloudFront with security headers (HSTS, CSP, X-Frame-Options, etc.)
- Application-level rate limiting via Redis
- Pre-auth lockout for failed login attempts
- CloudTrail with CIS Benchmark alarms

WAF would add:

- SQL injection protection at edge
- XSS protection at edge
- Known bad actors/IP reputation blocking
- Bot detection and mitigation
- AWS Managed Rules for OWASP Top 10

---

## Current State

The architecture diagrams show WAF but it is not currently deployed. The
`sst.config.ts` does not include WAF configuration. Documentation has been
updated to accurately reflect that WAF is not deployed.

---

## Proposed Solution

Add AWS WAFv2 WebACL with managed rule groups. Use the SST WAF example as a
syntax reference for `aws.wafv2.WebAcl` and rule definitions, then adapt it for
CloudFront scope.

```typescript
// sst.config.ts addition

const rateLimitRule = {
  name: "RateLimitRule",
  priority: 1,
  action: { block: {} },
  statement: {
    rateBasedStatement: {
      limit: 1000,
      aggregateKeyType: "IP",
    },
  },
  visibilityConfig: {
    cloudwatchMetricsEnabled: true,
    sampledRequestsEnabled: true,
    metricName: "RateLimitRule",
  },
};

const awsManagedRulesCommon = {
  name: "AWS-AWSManagedRulesCommonRuleSet",
  priority: 2,
  overrideAction: { none: {} },
  statement: {
    managedRuleGroupStatement: {
      vendorName: "AWS",
      name: "AWSManagedRulesCommonRuleSet",
    },
  },
  visibilityConfig: {
    cloudwatchMetricsEnabled: true,
    metricName: "AWSManagedRulesCommonRuleSet",
    sampledRequestsEnabled: true,
  },
};

const awsManagedRulesKnownBad = {
  name: "AWS-AWSManagedRulesKnownBadInputsRuleSet",
  priority: 3,
  overrideAction: { none: {} },
  statement: {
    managedRuleGroupStatement: {
      vendorName: "AWS",
      name: "AWSManagedRulesKnownBadInputsRuleSet",
    },
  },
  visibilityConfig: {
    cloudwatchMetricsEnabled: true,
    metricName: "AWSManagedRulesKnownBadInputsRuleSet",
    sampledRequestsEnabled: true,
  },
};

const awsManagedRulesSqli = {
  name: "AWS-AWSManagedRulesSQLiRuleSet",
  priority: 4,
  overrideAction: { none: {} },
  statement: {
    managedRuleGroupStatement: {
      vendorName: "AWS",
      name: "AWSManagedRulesSQLiRuleSet",
    },
  },
  visibilityConfig: {
    cloudwatchMetricsEnabled: true,
    metricName: "AWSManagedRulesSQLiRuleSet",
    sampledRequestsEnabled: true,
  },
};

const wafAcl = new aws.wafv2.WebAcl("WafAcl", {
  name: `solstice-${stage}-waf`,
  scope: "CLOUDFRONT",
  defaultAction: { allow: {} },
  visibilityConfig: {
    cloudwatchMetricsEnabled: true,
    metricName: `solstice-${stage}-waf`,
    sampledRequestsEnabled: true,
  },
  rules: [
    rateLimitRule,
    awsManagedRulesCommon,
    awsManagedRulesKnownBad,
    awsManagedRulesSqli,
  ],
  tags: {
    Environment: stage,
    Application: "solstice",
  },
});

// Associate WAF with CloudFront.
// The SST example uses WebAclAssociation for ALB; CloudFront expects webAclId
// on the distribution, so attach via TanStackStart transform.
```

---

## Cost Estimate

AWS WAF pricing (ca-central-1):

- WebACL: $5/month
- Rules: $1/rule/month (4 rules = $4/month)
- Requests: $0.60 per million requests

Estimated monthly cost: ~$10-15/month for dev, ~$20-50/month for prod depending
on traffic.

---

## Implementation Steps

1. **Add WAF WebACL** to `sst.config.ts` with managed rule groups
2. **Reference SST WAF example** for rule configuration patterns
3. **Associate with CloudFront** via TanStackStart transform
4. **Configure CloudWatch alarms** for WAF blocked requests
5. **Update architecture diagrams** to accurately show WAF (already shown)
6. **Update SEC-AGG-002 documentation** to include WAF
7. **Test in sin-dev** before prod deployment
8. **Monitor false positives** and tune rules as needed

---

## Considerations

### Pros

- Defense-in-depth: blocks attacks before reaching Lambda
- AWS Managed Rules: maintained by AWS security team
- IP reputation: blocks known bad actors
- Bot mitigation: reduces unwanted bot traffic
- Compliance: strengthens OWASP/ASVS posture

### Cons

- Additional cost (~$10-50/month)
- Potential false positives requiring tuning
- Slightly increased latency (typically <1ms)

### False Positive Mitigation

- Start with `count` mode before `block` mode
- Review CloudWatch metrics for blocked requests
- Create exceptions for legitimate use cases

---

## Acceptance Criteria

- [ ] WAF WebACL deployed to prod CloudFront
- [ ] Core Rule Set (CRS) enabled
- [ ] SQL injection rules enabled
- [ ] Known Bad Inputs rules enabled
- [ ] Rate limiting rule configured
- [ ] CloudWatch metrics visible
- [ ] No increase in false positive blocks for legitimate traffic
- [ ] SEC-AGG-002 documentation updated
- [ ] Architecture diagrams remain accurate

---

## References

- `sst.config.ts` - Current SST configuration (no WAF)
- `~/dev/_libraries/sst/examples/aws-load-balancer-waf/sst.config.ts` - SST WAF
  example (ALB association + managed rules)
- `docs/sin-rfp/response/04-system-requirements/security-sec-agg/final.md` - SEC-AGG-002
- [AWS WAF Developer Guide](https://docs.aws.amazon.com/waf/latest/developerguide/)
- [AWS Managed Rules](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups.html)
- [WAF Pricing](https://aws.amazon.com/waf/pricing/)
