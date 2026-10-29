import assert from "node:assert/strict";
import test from "node:test";

import { STRING_FILES, rebrandXml } from "./rebrand.mjs";

test("rewrites user-visible product names in string values", () => {
  const { output, hits } = rebrandXml(
    '<resources>\r\n    <string name="app_name">Nuvio</string>\r\n</resources>\r\n',
  );
  assert.equal(output, '<resources>\r\n    <string name="app_name">Kino</string>\r\n</resources>\r\n');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].line, 2);
});

test("keeps urls, domains, schemes and resource names", () => {
  const source = [
    '<string name="auth_qr_open">Open nuvio.tv/tv-login</string>',
    '<string name="server_error_official">api.nuvio.tv is the official server.</string>',
    '<string name="deep_link">Use nuvio://party/abc or https://nuvio.tv/Nuvio</string>',
  ].join("\n");
  const { output, hits } = rebrandXml(source);
  assert.equal(output, source);
  assert.equal(hits.length, 0);
});

test("handles suffixes, scripts, plurals and the licenses title", () => {
  const { output } = rebrandXml(
    [
      '<string name="a">Nuvio\'nun Nuvioライブラリ</string>',
      '<string name="licenses_attributions_nuvio_title">Nuvio TV</string>',
      '<plurals name="b"><item quantity="one">%d Nuvio item</item></plurals>',
      '<string-array name="c"><item>Nuvio Focus</item></string-array>',
    ].join("\n"),
  );
  assert.equal(
    output,
    [
      '<string name="a">Kino\'nun Kinoライブラリ</string>',
      '<string name="licenses_attributions_nuvio_title">Kino TV</string>',
      '<plurals name="b"><item quantity="one">%d Kino item</item></plurals>',
      '<string-array name="c"><item>Kino Focus</item></string-array>',
    ].join("\n"),
  );
});

test("leaves allowlisted upstream programme strings alone", () => {
  const source = [
    '<string name="support_nuvio_name">Support Nuvio</string>',
    '<string name="supporters_contributors_title">Support Nuvio</string>',
    '<string name="supporter_membership_title">Nuvio Membership</string>',
  ].join("\n");
  assert.equal(rebrandXml(source).output, source);
});

test("is idempotent", () => {
  const once = rebrandXml('<string name="x">Choose your Nuvio experience</string>').output;
  assert.equal(rebrandXml(once).output, once);
  assert.equal(rebrandXml(once).hits.length, 0);
});

test("targets the TV app string resources only", () => {
  assert.ok(STRING_FILES.test("app/src/main/res/values/strings.xml"));
  assert.ok(STRING_FILES.test("app/src/main/res/values-tr/strings.xml"));
  assert.ok(STRING_FILES.test("app/src/main/res/values/strings_party.xml"));
  assert.ok(STRING_FILES.test("app/src/debug/res/values/strings.xml"));
  assert.ok(STRING_FILES.test("app/src/main/res/values-b+es+419/strings_servers.xml"));
  assert.ok(!STRING_FILES.test("app/src/main/res/values/themes.xml"));
  assert.ok(!STRING_FILES.test("app/src/main/java/com/nuvio/tv/MainActivity.kt"));
  assert.ok(!STRING_FILES.test("ffmpeg-decoder-downmix/src/main/res/values/strings.xml"));
});
