// ─────────────────────────────────────────────────────────────
// Constants — User Roles
// ─────────────────────────────────────────────────────────────

const ROLES = Object.freeze({
  USER: 'USER',
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
});

const ROLE_HIERARCHY = Object.freeze({
  [ROLES.ADMIN]: 3,
  [ROLES.OWNER]: 2,
  [ROLES.USER]: 1,
});

module.exports = { ROLES, ROLE_HIERARCHY };
