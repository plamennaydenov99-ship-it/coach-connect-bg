/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLUB_PORTAL_SEGMENTS, clubPortalPathFor, clubProfilePath, homeFor } from './routes';

test('club accounts land in the club portal', () => {
  assert.equal(homeFor('club'), '/club');
  assert.equal(homeFor('coach'), '/coach');
  assert.equal(homeFor('athlete'), '/account');
});

test('public club profiles live under /clubs', () => {
  assert.equal(clubProfilePath('abc'), '/clubs/abc');
});

test('legacy club redirect ignores reserved portal segments', () => {
  for (const s of ['dashboard', 'members', 'calendar', 'facilities', 'messages', 'profile', 'settings']) {
    assert.ok(CLUB_PORTAL_SEGMENTS.includes(s));
  }
});

test('old club dashboard URLs map to club portal pages', () => {
  assert.equal(clubPortalPathFor(''), '/club/dashboard');
  assert.equal(clubPortalPathFor('/clients/x1'), '/club/members/x1');
  assert.equal(clubPortalPathFor('/availability'), '/club/calendar');
  assert.equal(clubPortalPathFor('/billing'), '/club/dashboard');
});
