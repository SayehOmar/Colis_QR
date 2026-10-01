import { useEffect } from "react";
import { getRuntimeOrigin } from "../seo/site";

function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string,
) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export type PageSeoProps = {
  title: string;
  description: string;
  path: string;
  /** Private / app areas that should stay out of search indexes */
  noindex?: boolean;
};

/**
 * Sets document title, description, canonical, and Open Graph / Twitter tags.
 */
export function PageSeo({
  title,
  description,
  path,
  noindex = false,
}: PageSeoProps) {
  useEffect(() => {
    const origin = getRuntimeOrigin();
    const canonicalPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${origin}${canonicalPath === "/" ? "/" : canonicalPath}`;
    const fullTitle = title.includes("CrossMed")
      ? title
      : `${title} | CrossMed`;

    document.title = fullTitle;

    upsertMeta("name", "description", description);
    upsertMeta(
      "name",
      "robots",
      noindex ? "noindex, nofollow" : "index, follow",
    );
    upsertLink("canonical", url);

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", "CrossMed");
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", `${origin}/logo.svg`);

    upsertMeta("name", "twitter:card", "summary");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
  }, [title, description, path, noindex]);

  return null;
}
