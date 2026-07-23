import { describe, it, expect } from "vitest";
import { rewriteReadingLinks } from "./rewrite-links";

const resolve = (href: string) =>
  href === "https://www.lesswrong.com/posts/abc123def456/some-post"
    ? "/readings/lesswrong__abc123def456"
    : null;

describe("rewriteReadingLinks", () => {
  it("rewrites a resolvable href and keeps the original on data-reading-link", () => {
    const html =
      '<p data-anchor="b-0001">See <a href="https://www.lesswrong.com/posts/abc123def456/some-post">this post</a>.</p>';
    expect(rewriteReadingLinks(html, resolve)).toBe(
      '<p data-anchor="b-0001">See <a href="/readings/lesswrong__abc123def456" data-reading-link="https://www.lesswrong.com/posts/abc123def456/some-post">this post</a>.</p>',
    );
  });

  it("preserves surrounding attributes and rewrites every matching anchor", () => {
    const html =
      '<a class="x" href="https://www.lesswrong.com/posts/abc123def456/some-post" rel="nofollow">a</a>' +
      '<a href="https://www.lesswrong.com/posts/abc123def456/some-post">b</a>';
    const out = rewriteReadingLinks(html, resolve);
    expect(out).toContain(
      '<a class="x" href="/readings/lesswrong__abc123def456" data-reading-link="https://www.lesswrong.com/posts/abc123def456/some-post" rel="nofollow">a</a>',
    );
    expect(out.match(/\/readings\//g)).toHaveLength(2);
  });

  it("leaves unresolvable, fragment, and relative hrefs untouched", () => {
    const html =
      '<a href="https://example.com/other">x</a>' +
      '<a href="#lw-fn-1">fn</a>' +
      '<a href="/local">rel</a>';
    expect(rewriteReadingLinks(html, resolve)).toBe(html);
  });

  it("never touches text content or data anchors", () => {
    const html =
      '<p data-anchor="b-0002" data-s="1">The URL https://www.lesswrong.com/posts/abc123def456/some-post in prose.</p>';
    expect(rewriteReadingLinks(html, resolve)).toBe(html);
  });
});
