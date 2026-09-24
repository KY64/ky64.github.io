import CleanCSS from "clean-css";
import markdownIt from "markdown-it";

export default function (eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.addFilter("cssmin", (code) =>
    new CleanCSS({level: 2}).minify(code).styles);
  eleventyConfig.addPassthroughCopy("src/css/mobile.css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addNunjucksFilter(
    "date",
    (date) => new Date(date).toISOString().split("T")[0],
  );

  // Build the side table of contents from the rendered article HTML. Only h2
  // and h3 are listed (h3 indented as a subsection); the h1 is the page title.
  // The markdown-it heading rules below emit a stable shape, so the headings
  // can be read back out of the rendered HTML:
  //   <h2 id="slug"><a href="#slug">Title</a></h2>
  // Returns "" when the article has no h2/h3, so the TOC is simply omitted.
  eleventyConfig.addFilter("toc", (html) => {
    const headingPattern = /<h([23]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
    const headings = [];
    for (const [, level, id, inner] of html.matchAll(headingPattern)) {
      // Drop the anchor the heading rules wrap the title in.
      const title = inner
        .replace(/^<a\b[^>]*>/, "")
        .replace(/<\/a>\s*$/, "")
        .trim();
      headings.push({ level, id, title });
    }
    if (headings.length === 0) return "";
    const items = headings
      .map(
        ({ level, id, title }) =>
          `<li${level === "3" ? ' class="sub"' : ""}><a href="#${id}">${title}</a></li>`,
      )
      .join("");
    return `<ol>${items}</ol>`;
  });

  const md = markdownIt({ html: true, linkify: true, typographer: true });
  const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noopener");
    return defaultRender(tokens, idx, options, env, self);
  };

  const slug = (text) => text.toLowerCase().replace(/[^\w]+/g, "-").replace(/(^-|-$)/g, "");
  const defaultHeading = md.renderer.rules.heading_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
    const title = tokens[idx + 1].children.reduce((acc, t) => acc + t.content, "");
    const id = slug(title);
    tokens[idx].attrSet("id", id);
    return `${defaultHeading(tokens, idx, options, env, self)}<a href="#${id}">`;
  };

  md.renderer.rules.heading_close = function(tokens, idx, options, env, self) {
    const tag = tokens[idx].tag;
    const defaultClose = self.renderToken(tokens, idx, options);
    return `</a>${defaultClose}`;
  };

  // Markdown tables can be wider than the reading column (especially the
  // embedding matrices in technical posts). Keep the document responsive by
  // giving each table its own horizontal scroll container.
  const defaultTableOpen = md.renderer.rules.table_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  const defaultTableClose = md.renderer.rules.table_close || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.table_open = function(tokens, idx, options, env, self) {
    return `<div class="table-scroll" tabindex="0" aria-label="Scrollable table">${defaultTableOpen(tokens, idx, options, env, self)}`;
  };
  md.renderer.rules.table_close = function(tokens, idx, options, env, self) {
    return `${defaultTableClose(tokens, idx, options, env, self)}</div>`;
  };

  eleventyConfig.setLibrary("md", md);
}
