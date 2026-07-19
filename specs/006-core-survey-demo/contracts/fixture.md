# Fixture Contract

The fictional psychology intake is a replaceable `FlowSchema` and must:

- provide sleep, stress, and life-change routes;
- provide request, spacious-capacity, and focused-capacity logistical routes;
- reconverge on shared contact-preference and personal-context pages;
- include single select, multiple select, short/long text, and bounded number inputs;
- include conditional visibility within at least one route;
- enforce required, range, choice, and maximum-length validation;
- have no unreachable node, dangling reference, visibility-order violation, semantic
  dead end, or route without a terminal;
- ship executable goldens with 100% measured edge coverage;
- directly contain every governed guard (`always`, `answered`, `selected`, `not`,
  `all`, `any`, `cmp`) and numeric expression (`num`, `answer`, `score`, `sum`);
- use option weights only for undisclosed logistical routing and never render a score;
- never expose a weighted score or clinical interpretation to respondents.

Replacing the schema and goldens with another conforming fixture must require no
change to app session orchestration or navigation components.
