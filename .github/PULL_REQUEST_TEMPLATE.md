<!--
Public PR template for wonder-plugins.
This is the OSS marketplace repo, so the template is intentionally lighter
than the internal Wonder default: no Linear ticket, no internal-only
checklists. Maintainers may still ask follow-up questions during review.
-->

## Summary

<!--
What does this PR change and why? One bullet per substantive change.
For new plugins, link to the plugin's website or repo.
-->

- 

## Plugin or change type

- [ ] New plugin manifest (`plugins/<plugin-name>/manifest.json`)
- [ ] Update to an existing plugin manifest
- [ ] Validator or schema change
- [ ] Docs / README only
- [ ] CI / repo tooling

## Test plan

- [ ] `npm install`
- [ ] `npm run validate` passes locally
- [ ] If this adds a new plugin: confirm the listed install URL, commands, and screenshots resolve
- [ ] If this changes the schema or validator: existing manifests still validate

## Maintainer notes

<!--
Optional. Anything reviewers should know that isn't obvious from the diff —
context, trade-offs, follow-up work, related issues.
-->

---

<sub>Wonder maintains plugin standards in [`aquila-lab/.github`](https://github.com/aquila-lab/.github). PR conventions for this repo are intentionally relaxed for external contributors.</sub>
